# Media & model APIs in Composio — exploration and design

**Describe a use case → get models you can invoke → create.** Two calls in the SDK, three
tools for an agent, across every media provider Composio already carries.

Grounded in `@composio/core@0.29.0` (installed and read, not recalled), the live Composio
docs and toolkit catalog, fal's MCP documentation, and Higgsfield's MCP — which I called
live from this session. 2026-11-10.

## Read in this order

| | |
|---|---|
| [`docs/00-exploration-notes.md`](docs/00-exploration-notes.md) | What Composio's SDK gives us today, which primitives to reuse, and the four gaps. |
| [`docs/03-mcp-teardown.md`](docs/03-mcp-teardown.md) | **fal's, Higgsfield's and Runway's MCP servers, torn down.** All three ship this flow in three different shapes; what to copy, and the specific weakness in each. The evidence for everything else. |
| [`docs/01-design.md`](docs/01-design.md) | The design, as five rules: invocable search results, constraints that filter rather than rank, one canonical schema per modality, bounded-wait creation, committed prices. |
| [`docs/04-mcp-flow.md`](docs/04-mcp-flow.md) | **The MCP flow**: search models → get schema → generate. Which existing tools to extend, which two to add, why discovery stays one tool, and the failure modes. |
| [`docs/02-variations.md`](docs/02-variations.md) | **Provider-level vs model-level**, side by side. Then three implementation strategies, adapters, and a phased recommendation. |
| [`spec/models.types.ts`](spec/models.types.ts) | The proposed public surface. Typechecks under `--strict`. |
| [`examples/`](examples) | TS, Python and HTTP usage. Start with `01-use-case-to-create.ts`; `07-mcp-transcript.md` is every MCP call for one real task. |

## What I found

**Composio already ships the media providers as ordinary toolkits** — `fal_ai`, `bfl`,
`luma_labs`, `heygen`, `replicate`, `elevenlabs`, `captions` — and they fail in opposite
directions. `fal_ai` is 13 generic passthrough tools over a 600-model catalog, so model
identity is an unvalidated free-text string and the models are invisible to tool search.
`elevenlabs` is **396 tools**, so the models are visible but drown the context window.
Both are discovery failures, which matters because discovery is the feature Composio is
for. On top of that: no uniform invocation (a provider swap is a rewrite), no uniform job
or artifact lifecycle (results are provider-hosted expiring URLs that never reach
Composio's own file layer), and no way to bound cost before spending.

**Then I tore down the three servers that already do this flow.** fal's MCP needs three calls
(`search_models` → `get_model_schema` → `run_model`) because its search results carry only
an id and a description; its docs say the recommender's rank *"follows Explore discovery
order; it is not a quality or speed score"*, and `estimate_cost` is *"advisory, not a
quote"*. Higgsfield's is better shaped — one call returns each model's full parameters,
named media slots with roles, and an itemized `match_reason` — but in the live call I made
asking for an **8-second** clip, the top-ranked model (score 1480) has
`duration_range: {min: 12, max: 15}` and **cannot satisfy the request**, while a model that
can (4–30s, 1080p, audio) came fourth at score 320. Its own `match_reason` shows why:
`marketing-video-model-priority+1200`. There are no prices anywhere in the response.

**Runway** is a third shape worth studying: nine tools, one per *capability*, with `model`
**optional** and defaulting to a recommended model per verb — intent-first invocation
shipped as the default, which is good external validation for the router here. It also does
the one thing neither of the others does: it validates payloads against per-model
constraints **locally, before the request leaves**, so an invalid (but still billable) call
never happens. Worth copying outright. Against that: artifacts expire in **24 hours,
unrecoverably**; its documented spend control is to *tell your assistant to ask first*; and
MCP access is credits-only, so an upscale that is free in the Runway app costs credits
through MCP.

So: **all three do semantic matching well and constraint satisfaction not at all** — and
all three are converging on aggregation, which means catalog size can't be the
differentiator.

## The design

Add one primitive pair — `provider → model`, mirroring `toolkit → tool` — and two verbs,
`search` and `create`.

```ts
const { results, excluded } = await composio.models.search({
  query: '8s product turntable from one photo, cinematic',       // soft: semantic
  requires: { durationSeconds: 8, resolution: '1080p', audio: true },  // hard: boolean
  maxCostUsd: '0.50',
});

const gen = await composio.models.create({
  userId: 'user_123',
  ...results[0].call,                     // constraints already mapped to its schema
  input: { ...results[0].call.input, prompt: 'slow orbit',
           media: { startImage: { s3key: 'uploads/astrolabe.png' } } },
});
```

Five rules carry it:

1. **A search result is invocable.** Canonical schema, named media slots, a committed quote
   and a pre-mapped `call` come back with the result — collapsing fal's three calls to two.
2. **Hard constraints filter; they never merely rank.** A violator is *excluded and
   reported* (`excluded[]`, `considered`, `why`), with `relaxations[]` so a strict filter is
   never a dead end. This is the differentiator, and the one thing an aggregator is
   structurally better placed to do than a platform with a house model to promote.
3. **One canonical schema per modality**, so a provider swap is one changed string — with
   `warnings[]` for ignored fields (never a silent drop, never a hard fail),
   `providerOptions` namespaced per provider, and `raw` always present.
4. **Creation has a bounded wait** (~25s, then a job id and ETA), a replayable `recipe`, a
   first-class `idempotencyKey`, and **local pre-flight validation against the envelope**
   (Runway's idea) — because in media a retry is a purchase and a rejected call still bills.
5. **Prices are committed, not advisory**, so `maxCostUsd` rejects pre-flight rather than
   reporting after.

Over MCP the flow is `COMPOSIO_SEARCH_TOOLS` → (`COMPOSIO_GET_TOOL_SCHEMAS`) →
`COMPOSIO_CREATE_MEDIA` → (`COMPOSIO_GET_GENERATION`): **two existing tools extended, two
new ones**, against fal's ~35 and Runway's 9. Discovery deliberately does not get its own
tool — a second search tool would make the agent route between them before it knows what it
needs. That reuse is the argument for building this inside Composio rather than shipping
another media MCP.

Nothing below the API is new: Instant for metering and keyless runs, `composio.files` plus
the session mount for artifacts, triggers for async, the existing HITL input-request flow
for approvals, session hooks for policy, and tool execution underneath for logging and
versioning.

**Recommendation:** ship the catalog first — read-only, creation still on today's toolkit
tools. Non-breaking, independently valuable, and it forces the genuinely hard part to be
proven before anything depends on it.

## Caveats

`examples/` and `spec/` describe a surface that does not exist yet; they are written to be
reviewed as DX. Only `spec/models.types.ts` typechecks (the examples parse-check but
reference proposed APIs). Prices, latencies and model ids in them are illustrative.
Claims about *current* behaviour are cited in `docs/00-exploration-notes.md` and
`docs/03-mcp-teardown.md`; the Higgsfield ranking observation is a single live call, not a
benchmark — though the boost is visible in the response itself.
