# The MCP flow: search models → get schema → generate

## The finding that decides this

Composio's `COMPOSIO_SEARCH_TOOLS` response **already** has a three-step flow with an
adaptive schema step. From `src/types/toolRouter.types.ts`:

```ts
const ToolRouterSessionSearchToolSchemaSchema = z.object({
  toolSlug, toolkit, description,
  hasFullSchema: z.boolean().optional(),      // ← was the schema inlined?
  inputSchema:  z.record(...).optional(),      // ← inlined when affordable
  outputSchema: z.record(...).optional(),
  schemaRef: z.object({                        // ← otherwise, go fetch it
    tool: z.literal('COMPOSIO_GET_TOOL_SCHEMAS'),
    args: z.object({ toolSlugs: z.array(z.string()) }),
    message: z.string().optional(),
  }).optional(),
});
```

So search inlines schemas when it can afford to and hands back a *self-describing pointer*
when it can't. The documented workflow is already `COMPOSIO_SEARCH_TOOLS` →
(`COMPOSIO_GET_TOOL_SCHEMAS`) → `COMPOSIO_MULTI_EXECUTE_TOOL`.

**Models should ride that pattern, not a parallel one.** Two consequences:

1. The schema step needs **no new tool** — `COMPOSIO_GET_TOOL_SCHEMAS` already takes slugs
   and already is the advertised continuation. Model slugs join the same namespace.
2. Discovery needs **no new tool either**, and shouldn't have one. More on why below.

Only *generation* needs something new, because `MULTI_EXECUTE` cannot express a bounded
wait, a pre-flight quote, or an artifact.

---

## The flow

```
┌─ 1. DISCOVER ──────────────────────────────────────────────────────────────┐
│ COMPOSIO_SEARCH_TOOLS                                          (existing)  │
│   { queries: [{ use_case: "8s product turntable, 1080p, audio" }],         │
│     requires: { modality: "video", duration_seconds: 8, audio: true },     │
│     max_cost_usd: "0.50" }                                                 │
│                                                                            │
│ → results[].model_slugs      ranked, constraint-filtered                   │
│   model_schemas{}            inline canonical schema for the top 2-3       │
│                              + schema_ref for the rest                     │
│   model_excluded[]           every candidate dropped, and why              │
│   next_steps_guidance[]      "call COMPOSIO_CREATE_MEDIA with ..."         │
└────────────────────────────────────────────────────────────────────────────┘
                     │                              │
      schema inlined │                              │ schema_ref returned
                     │                              ▼
                     │          ┌─ 2. SCHEMA ─────────────────────────────┐
                     │          │ COMPOSIO_GET_TOOL_SCHEMAS    (existing) │
                     │          │   { tool_slugs: ["luma_labs/ray-3"] }   │
                     │          │ → canonical + provider_options + quote  │
                     │          └─────────────────────────────────────────┘
                     ▼                              │
┌─ 3. GENERATE ◄─────┴──────────────────────────────┘                        ┐
│ COMPOSIO_CREATE_MEDIA                                               (NEW)  │
│   { model: "luma_labs/ray-3",                                              │
│     input: { prompt, media: { start_image }, duration_seconds: 8 },        │
│     wait: "brief", max_cost_usd: "0.50", idempotency_key: "..." }          │
│                                                                            │
│ → completed  → artifacts[], cost, recipe                                   │
│   running    → { generation_id, eta_seconds, poll_with }                   │
└────────────────────────────────────────────────────────────────────────────┘
                                     │ still running
                                     ▼
┌─ 4. POLL ──────────────────────────────────────────────────────────────────┐
│ COMPOSIO_GET_GENERATION                                             (NEW)  │
│   { generation_id: "gen_9k3m" }   → status, progress, artifacts            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Net: +2 tools.** Steps 1 and 2 are existing tools with extended payloads.

---

## Why not a `COMPOSIO_SEARCH_MODELS` tool

This is the decision I'd push back on hardest, so here is the reasoning.

If both `COMPOSIO_SEARCH_TOOLS` and `COMPOSIO_SEARCH_MODELS` are in the tool list, **the
model has to route between them before it knows what it needs** — and the boundary is
genuinely ambiguous:

| Request | Which search? |
|---|---|
| "post this to Slack" | tools |
| "make me a video" | models |
| "generate a thumbnail and upload it to Drive" | **both** |
| "transcribe this meeting recording" | **either** — `elevenlabs` has a transcribe *tool* and a transcribe *model* |
| "remove the background from this logo" | **either** — a `fal_ai` model, or `photoroom`'s tool |

A wrong first call costs a round trip and often ends in "no results", from which agents
reliably do the wrong thing: invent a model id, or give up and describe the picture in
prose. Composio's whole thesis is *one* entry point that figures out what you need —
`COMPOSIO_SEARCH_TOOLS` is documented as returning "the `session_id` that ties the rest of
the workflow together". Splitting discovery breaks that invariant for a cosmetic gain.

So: **one search, two result kinds.** The response grows a parallel set of model fields
alongside the tool fields, and a single query can return both — which is the only correct
answer for "generate a thumbnail and upload it to Drive".

(The SDK is a different matter. `composio.models.search()` stays a distinct typed method
because a developer writing code *knows* which primitive they want, and conflating them
there buys nothing. The constraint is specific to the agent's tool list.)

---

## Step 1 — `COMPOSIO_SEARCH_TOOLS`, extended

**New optional arguments.** Omit them and behaviour is exactly as today.

| Arg | Type | Notes |
|---|---|---|
| `requires` | object | Hard constraints: `modality`, `capabilities`, `duration_seconds`, `resolution`, `aspect_ratio`, `audio`, `languages`, `instant`. Filters — a violator is excluded, never ranked down. |
| `max_cost_usd` | decimal string | Compared against the per-request quote, not the headline rate. |
| `include` | `["tools","models"]` | Default `["tools","models"]`. Set `["tools"]` to opt out entirely. |
| `prefer` | enum | `cheapest \| fastest \| best \| balanced`. Orders results; never relaxes `requires`. |

**New response fields**, mirroring the existing tool fields one-for-one:

```jsonc
{
  "results": [{
    "index": 0,
    "use_case": "8s product turntable, 1080p, synced audio",
    "primary_tool_slugs": [],
    "model_slugs": ["luma_labs/ray-3", "fal_ai/veo-3-fast", "runway/gen-4.5"],  // NEW
    "toolkits": ["luma_labs", "fal_ai", "runway"],
    "execution_guidance": "Pass media.start_image, not a bare URL in prompt.",
    "known_pitfalls": ["ray-3 ignores negative_prompt",
                       "veo-3 bills full duration on a rejected render"],
    "recommended_plan_steps": ["COMPOSIO_CREATE_MEDIA with luma_labs/ray-3"]
  }],

  // NEW — exactly parallel to `tool_schemas`, same adaptive mechanism
  "model_schemas": {
    "luma_labs/ray-3": {
      "model_slug": "luma_labs/ray-3",
      "provider": "luma_labs",
      "modality": "video",
      "has_full_schema": true,                    // inlined: top candidate
      "canonical": "video.create@1",
      "input_schema":  { "...": "JSON Schema" },
      "output_schema": { "...": "JSON Schema" },
      "unsupported": ["negative_prompt"],
      "envelope": { "duration_seconds": { "min": 1, "max": 10 },
                    "resolutions": ["480p","720p","1080p"], "audio": true },
      "media": [{ "slot": "start_image", "accepts": ["image"] },
                { "slot": "end_image",   "accepts": ["image"] }],
      "quote": { "max_usd": "0.36", "eta_seconds": 74, "bounded": true },
      "instant": { "supported": true },
      "call": { "model": "luma_labs/ray-3",
                "input": { "duration_seconds": 8, "resolution": "1080p", "audio": true } },
      "why": ["meets 8s (range 1-10s)", "native synced audio", "cheapest qualifying"]
    },
    "runway/gen-4.5": {
      "model_slug": "runway/gen-4.5",
      "provider": "runway",
      "modality": "video",
      "has_full_schema": false,                   // deferred: rank 3
      "quote": { "max_usd": "0.48", "eta_seconds": 55, "bounded": true },
      "why": ["meets 8s", "1080p supported"],
      "schema_ref": {                             // the existing self-describing pointer
        "tool": "COMPOSIO_GET_TOOL_SCHEMAS",
        "args": { "tool_slugs": ["runway/gen-4.5"] },
        "message": "Fetch the full schema before using this model."
      }
    }
  },

  // NEW — what makes the constraint filter trustworthy
  "model_excluded": [
    { "model": "fal_ai/kling-o3",  "reason": "max duration 5s < required 8s" },
    { "model": "bfl/flux-3-video", "reason": "no native audio" },
    { "model": "fal_ai/veo-3",     "reason": "quote $0.64 > max_cost_usd $0.50" }
  ],
  // NEW — a strict filter must never be a dead end
  "model_relaxations": [
    { "drop": "audio", "would_add": 6, "cheapest_usd": "0.12" },
    { "raise": "max_cost_usd", "to": "0.70", "would_add": 2 }
  ],

  "toolkit_connection_statuses": [ /* unchanged — covers model providers too */ ],
  "next_steps_guidance": [
    "3 models qualify; luma_labs/ray-3 is cheapest at $0.36.",
    "Its schema is inlined — pass `call.input` plus a prompt to COMPOSIO_CREATE_MEDIA.",
    "runway/gen-4.5 needs COMPOSIO_GET_TOOL_SCHEMAS first."
  ]
}
```

**The inline budget.** A full canonical + provider schema is roughly 1.5–4 KB of JSON
(estimated from comparable tool schemas), so inlining ten would add ~8k tokens to a search
response — more than the entire meta-tool list it was meant to replace. Hence: **inline the
top 2–3, `schema_ref` the rest.** That is not a new policy; it is precisely what
`has_full_schema` exists for today, now applied to models.

**Connection status comes free.** `toolkit_connection_statuses` already reports per-toolkit
connection state and `instant_account.allowed_tool_slugs`. Since a model's provider *is* a
toolkit, an unconnected provider surfaces through the existing field, and the existing
`COMPOSIO_MANAGE_CONNECTIONS` resolves it. No new auth path.

## Step 2 — `COMPOSIO_GET_TOOL_SCHEMAS`, extended

Accepts model slugs in the same `tool_slugs` array. A `/` in the slug disambiguates a model
(`luma_labs/ray-3`) from a tool (`RUNWAY_GENERATE_IMAGE`) with no grammar change, and the
agent never has to know the difference — it just follows the `schema_ref` it was handed.

```jsonc
// → { "tool_slugs": ["luma_labs/ray-3", "GMAIL_SEND_EMAIL"] }   // mixed is fine
{
  "schemas": {
    "luma_labs/ray-3": {
      "kind": "model",                         // NEW discriminator
      "canonical": "video.create@1",
      "input_schema": { "...": "..." },
      "envelope": { "...": "..." },
      "media": [ { "slot": "start_image", "accepts": ["image"] } ],
      "provider_options": { "...": "provider-specific JSON Schema" },
      "quote_with": "COMPOSIO_CREATE_MEDIA",   // quotes need the actual input
      "unsupported": ["negative_prompt"]
    },
    "GMAIL_SEND_EMAIL": { "kind": "tool", "...": "..." }
  }
}
```

One subtlety: a *quote* depends on the input (duration × resolution), so this step returns
the price **rate and envelope**, not a number. The committed number comes from
`COMPOSIO_CREATE_MEDIA` with `dry_run: true`, or inline in search where the constraints
already pin the shape.

## Step 3 — `COMPOSIO_CREATE_MEDIA` (new)

### Why this can't ride `COMPOSIO_MULTI_EXECUTE_TOOL`

I tried to make it fit. Five things block it, each independently sufficient:

| | `MULTI_EXECUTE` | Generation needs |
|---|---|---|
| **Duration** | returns when the call returns | a bounded wait that degrades to a job id — a 4K render is minutes, and 50 parallel renders is not a thing anyone wants |
| **Cost** | no notion of money | `max_cost_usd` rejected **pre-flight**, plus a returned charge |
| **Idempotency** | re-call is free | re-call is a **purchase**; needs `idempotency_key` |
| **Output** | JSON back to the model | binary artifacts persisted to `composio.files` + the session mount, never pasted into context |
| **Validation** | provider's job | local envelope check before the request leaves (Runway's idea — see `03-mcp-teardown.md`) |

Overloading `MULTI_EXECUTE` would mean adding four concepts to the hottest tool in the
product for the benefit of one modality. A separate tool is the smaller change.

### Shape

```jsonc
// → request
{
  "model": "luma_labs/ray-3",      // or an intent: "video", or { modality, prefer, requires }
  "input": {
    "prompt": "slow orbit, shallow depth of field",
    "media": { "start_image": { "artifact_id": "art_7f2" } },
    "duration_seconds": 8, "resolution": "1080p", "audio": true
  },
  "provider_options": { "luma_labs": { "loop": false } },
  "wait": "brief",                 // brief (default) | block | none
  "max_cost_usd": "0.50",
  "idempotency_key": "order_8831:hero",
  "dry_run": false                 // true → committed quote + validation, nothing spent
}

// ← completed inside the wait
{
  "status": "completed",
  "model": "luma_labs/ray-3",
  "artifacts": [{ "id": "art_b81", "kind": "video", "mime_type": "video/mp4",
                  "s3key": "generations/gen_9k3m/0.mp4",
                  "sandbox_path": "/mnt/files/generations/gen_9k3m/0.mp4",
                  "url": "https://files.composio.dev/...", "url_expires_at": "...",
                  "duration_seconds": 8, "width": 1920, "height": 1080 }],
  "cost": { "usd": "0.36", "quoted_usd": "0.36", "source": "instant" },
  "recipe": { "model": "luma_labs/ray-3", "input": { "...": "..." } },
  "warnings": [], "log_id": "log_...", "generation_id": "gen_9k3m"
}

// ← still running when the wait expires
{
  "status": "running",
  "generation_id": "gen_9k3m",
  "eta_seconds": 50,
  "poll_after_seconds": 15,
  "poll_with": "COMPOSIO_GET_GENERATION",
  "message": "Render in progress. Poll COMPOSIO_GET_GENERATION in ~15s. Do NOT call COMPOSIO_CREATE_MEDIA again — that starts a second billable render."
}
```

That last `message` is load-bearing. fal's docs warn about exactly this failure
(*"another `run_model` or `submit_job` call creates a new billable job"*), and an agent that
re-submits instead of polling silently doubles the bill. The instruction belongs in the
payload, where the model will actually read it — not only in documentation.

`wait` defaults to `brief` (~25s) rather than `block`, because the agent case is the common
one over MCP and a hung tool call is worse than a job id. fal uses 45s for the same reason;
25s fits more MCP clients' default timeouts.

### Artifacts never enter the context

The response carries metadata and paths, never bytes or base64. ElevenLabs tools return
base64 audio today; a minute of it will blow a context window. Artifacts land in
`composio.files` with a `sandbox_path`, so the agent post-processes them with
`COMPOSIO_REMOTE_BASH_TOOL` (ffmpeg, concat, thumbnails) or hands the signed URL to the
user. For MCP clients that render media inline, the artifact can additionally be returned
as an MCP `resource` link — an opt-in per client, not a default.

## Step 4 — `COMPOSIO_GET_GENERATION` (new)

```jsonc
// → { "generation_id": "gen_9k3m", "wait": "brief" }   // optional second bounded wait
{ "status": "running", "progress": { "percent": 62, "stage": "rendering" },
  "eta_seconds": 20, "poll_after_seconds": 10 }
```

Also accepts `generation_ids[]` for a batch, and `action: "cancel"`.

**Why not fold polling into `COMPOSIO_CREATE_MEDIA`?** It would keep the budget at +1, and
I considered it: a call with only a `generation_id` would mean "poll". But then the *same
tool* both spends money and checks on money already spent, and the failure mode of
confusing them is a duplicate charge. A separate read-only tool makes double-billing
structurally hard rather than discouraged by a prompt. The extra tool is cheap insurance;
`COMPOSIO_GET_GENERATION` has three parameters.

---

## Tool budget

| | Before | After |
|---|---|---|
| `COMPOSIO_SEARCH_TOOLS` | ✓ | ✓ extended |
| `COMPOSIO_GET_TOOL_SCHEMAS` | ✓ | ✓ extended |
| `COMPOSIO_MULTI_EXECUTE_TOOL` | ✓ | ✓ unchanged |
| `COMPOSIO_MANAGE_CONNECTIONS` | ✓ | ✓ unchanged |
| `COMPOSIO_PROXY_EXECUTE` | ✓ | ✓ unchanged |
| `COMPOSIO_REMOTE_WORKBENCH` / `_BASH_TOOL` | ✓ | ✓ unchanged |
| **`COMPOSIO_CREATE_MEDIA`** | — | **new** |
| **`COMPOSIO_GET_GENERATION`** | — | **new** |

**+2**, versus fal's ~35 media tools and Runway's 9. Sessions that don't want them drop
them with the existing policy grammar:

```ts
await composio.create('user_123', { models: false });            // both tools gone
await composio.create('user_123', { models: { modalities: { enable: ['image'] } } });
```

Gating is per-modality, so an image-only session advertises the tools with a narrowed
catalog rather than a different tool list — the tool list stays stable across sessions,
which matters for prompt caching.

---

## Failure modes, and what catches each

| Failure | Catch |
|---|---|
| Agent invents a model slug | Not in the catalog → `404` naming the nearest matches; `search` is the only source of slugs |
| Agent guesses parameters | Canonical schema inlined or `schema_ref` returned; local envelope validation rejects before spending |
| Agent re-submits instead of polling | `poll_with` + the explicit don't-resubmit message, and `idempotency_key` makes a replay free |
| Agent picks a model that can't meet the ask | Constraint violators are **excluded** from results, not ranked down (the Higgsfield failure in `03-mcp-teardown.md`) |
| Agent burns turns polling | `wait: "brief"` lands most images in the first call; `poll_after_seconds` paces the rest |
| Agent spends too much | `max_cost_usd` pre-flight + session `budget.max_usd_per_session`; `on_exceeded: "require_approval"` routes to the existing HITL flow |
| Search returns nothing | `model_relaxations` gives a concrete next query instead of an empty array |
| Provider not connected | Existing `toolkit_connection_statuses` → `COMPOSIO_MANAGE_CONNECTIONS` |
| Huge binary into context | Artifacts are metadata + paths only; bytes stay in `composio.files` |
| Two discovery tools confuse the agent | There is only one |

---

## The flow collapses or expands with the agent's confidence

The three steps are a *maximum*, not a fixed cost:

```
1 call   COMPOSIO_CREATE_MEDIA { model: "image", input: { prompt } }
         ↑ an intent instead of a slug: routing does discovery server-side.
           Right for "just make me a picture", where model choice is not the point.

2 calls  SEARCH_TOOLS → CREATE_MEDIA
         ↑ the common case. Schema was inlined for the top candidate.

3 calls  SEARCH_TOOLS → GET_TOOL_SCHEMAS → CREATE_MEDIA
         ↑ the agent wants a lower-ranked model, or a provider-specific option.

4 calls  + GET_GENERATION, once or twice, for a long render.
```

Nothing forces the middle step when search already paid for it, and nothing hides it when
the agent needs it. That adaptiveness is the existing `has_full_schema` contract — which is
the argument for extending Composio's tools rather than bolting a second flow beside them.

A literal wire transcript is in `examples/07-mcp-transcript.md`.
