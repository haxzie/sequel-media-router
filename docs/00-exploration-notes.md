# Exploration: what Composio's SDK actually gives us today

Verified against `@composio/core@0.29.0` (installed and read: `src/models/*`, `src/types/*`)
and the live docs (`docs.composio.dev`, `composio.dev/toolkits`) on 2026-11-10.

## 1. The shape of the SDK

Two surfaces, one of them now primary.

**Sessions (primary).** A session is a per-user, policy-scoped handle. Everything
interesting hangs off it:

```ts
const composio = new Composio({ provider: new OpenAIAgentsProvider() });
const session  = await composio.create('user_123', { toolkits: ['fal_ai'] });

await session.tools();            // provider-shaped tool defs (meta tools by default)
await session.search({ query });  // semantic tool discovery
await session.execute(slug, args, { account });
await session.executeMeta('COMPOSIO_SEARCH_TOOLS', { queries: [{ use_case: '...' }] });
await session.authorize('fal_ai'); await session.ensureConnected('fal_ai');
await session.update({ ... });     // policy patch, optimistic-concurrency via configVersion
session.mcp.url;                   // same session over MCP
session.experimental.files;        // list/upload/download/delete on /mnt/files/
```

**Direct execution (legacy but supported).** `composio.tools.execute(slug, { userId,
arguments, version })`, `composio.tools.proxy(...)`, `composio.tools.getRawComposioToolBySlug(...)`,
plus `composio.files.upload/download`, `composio.toolkits`, `composio.triggers`,
`composio.webhooks`, `composio.logs`, `composio.usage`, `composio.keyring`,
`composio.sessionConfigs`, `composio.mcp`.

**Meta tools** are the agent-facing API: `COMPOSIO_SEARCH_TOOLS`,
`COMPOSIO_GET_TOOL_SCHEMAS`, `COMPOSIO_MANAGE_CONNECTIONS`,
`COMPOSIO_MULTI_EXECUTE_TOOL`, `COMPOSIO_PROXY_EXECUTE`, `COMPOSIO_REMOTE_WORKBENCH`,
`COMPOSIO_REMOTE_BASH_TOOL`, `COMPOSIO_SUBMIT_FEEDBACK`. The contract that makes Composio
work is: *hand the model ~8 tools, let it find the other 20,000 at runtime.*

## 2. Primitives we get to reuse (not rebuild)

| Primitive | Where | Why it matters for media |
|---|---|---|
| Semantic search | `session.search()` → `primaryToolSlugs`, `executionGuidance`, `knownPitfalls`, `recommendedPlanSteps` | Discovery already returns *guidance*, not just hits. Model discovery should return the same shape. |
| Instant (metered) execution | `account: 'instant_account'`, `instant.returnInstantCharge`, `instantCharge` on the result, `instant.returnPricesInSearch` | Per-tool metered billing on Composio's own provider accounts — no user API key. Exactly the model media generation needs. |
| File layer | `composio.files.upload/download`, `FileUploadData {name, mimetype, s3key}` | Composio already has durable blob storage and an `s3key` descriptor convention. |
| Session file mount | `session.experimental.files.{list,upload,download,delete}`, surfaced at `/mnt/files/` in the sandbox | A natural home for generated artifacts, already reachable by the agent's bash/python tools. |
| Approvals / HITL | `tags: { require_approval: [...] }` → `ComposioToolInputRequiredError` with `inputRequests`/`requestState`, replayed via `inputResponses` | A ready-made gate for "this call costs $0.80, confirm". |
| Session hooks | `hooks: [...]`, `resultType: 'blocked'`, `blockReason` | Server-side policy enforcement point. |
| Tool hints | `readOnlyHint`/`createHint`/`updateHint`/`destructiveHint`, filterable via `tags` | The extension point for a media/`generative` classification. |
| Triggers + webhooks | `composio.triggers.{create,subscribe,parse,verifyWebhook}`, pusher channel under `src/services/pusher` | Async job completion and progress streaming already have transport. |
| Toolkit versioning | dated versions, `toolkitVersions`, `dangerouslySkipVersionCheck` | Model/schema drift has an existing answer. |
| Logs + usage | `composio.logs`, `composio.usage`, `logId` on every execute | Observability for generations comes free if we route through tool execution. |

## 3. Media models today: three toolkits, three different worlds

Media providers already exist in the catalog — as ordinary toolkits.

**`fal_ai`** — 13 tools, Instant-enabled, latest version `20261101_00`:
`FAL_AI_SUBMIT_ASYNC_JOB` (Instant), `FAL_AI_GET_QUEUE_REQUEST_RESULT` (Instant),
`FAL_AI_RUN_MODEL_SYNC`, `FAL_AI_SUBSCRIBE_ASYNC_JOB`, `FAL_AI_QUEUE_GET_STATUS`,
`FAL_AI_QUEUE_GET_STATUS_STREAM`, `FAL_AI_CANCEL_QUEUE_REQUEST`, `FAL_AI_GET_MODELS`,
`FAL_AI_GET_PRICING`, `FAL_AI_ESTIMATE_PRICING`, `FAL_AI_LIST_MODEL_REQUESTS`,
`FAL_AI_UPLOAD_FILE`, `FAL_AI_GET_JWKS`.

That's a **thin passthrough over a 600-model catalog**. The model identity lives in a
free-text `model` argument and the real input schema lives in an opaque `input` blob.

**`elevenlabs`** — **396 tools**. The opposite failure: one tool per endpoint, so
text-to-speech alone spans a dozen near-duplicates (`..._TEXT_TO_SPEECH`,
`..._STREAM`, `..._WITH_TIMESTAMPS`, `..._STREAM_WITH_TIMESTAMPS`, dialogue variants…),
and it has quietly grown image generation and music tools too.

**Others:** `heygen` (74 tools), `luma_labs` (11), plus `bfl`, `replicate`, `captions`,
`openai`. Composio's own marketing already positions Instant as the fal alternative,
with `toolkits: ["fal_ai", "bfl", "luma_labs"]`.

## 4. The four concrete gaps

1. **Models are invisible to discovery.** Search indexes *tools*. For fal, 600+ models
   hide behind one tool, so "find me a model that makes a 10s 1080p clip with audio"
   cannot be answered — search returns `FAL_AI_SUBMIT_ASYNC_JOB` and the agent has to
   already know `fal-ai/veo3`. For ElevenLabs the same query drowns in 396 tools.
   Both directions are discovery failures, and they are the *defining* Composio feature.

2. **No uniform invocation.** Every provider names things differently
   (`aspect_ratio` vs `width`/`height`, `image_url` vs base64 vs upload-then-reference,
   `duration` in seconds vs frames). Swapping providers is a rewrite, so nobody
   comparison-shops — which is the whole reason to go through an aggregator.

3. **No uniform job or artifact lifecycle.** fal is queue + webhook + JWKS verification;
   HeyGen is polling; ElevenLabs returns base64 or a stream. Agents burn turns polling.
   Results are **provider-hosted expiring URLs** that never land in Composio's own file
   layer — even though that layer exists and the sandbox already mounts it.

4. **Cost is unbounded and unquotable.** `FAL_AI_ESTIMATE_PRICING` exists but is
   fal-only. The Instant docs say plainly: *"The Session API does not have a dollar
   spend-cap parameter"* and `return_instant_charge` reports cost **after** execution.
   For $0.0001 API calls that is tolerable; for a $1.20 video render it is not.

## 5. Design constraint fallen out of this

Media generation differs from every other Composio tool on four axes: it is **slow**
(seconds to minutes), **expensive** (cents to dollars per call), **binary-producing**,
and **model-indexed rather than endpoint-indexed**. The first three already have partial
machinery in the SDK. The fourth — a model as a first-class, searchable, uniformly
invocable object — does not exist, and is where the new surface has to go.
