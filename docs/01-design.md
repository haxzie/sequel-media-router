# Design: describe a use case, get models, create

## The contract

Two calls. The first takes a use case and returns models you can immediately invoke. The
second creates.

```ts
// 1. "Here's what I want to make."
const { results } = await composio.models.search({
  query: '8s product turntable from one reference photo, synced audio, 1080p',
  requires: { durationSeconds: 8, resolution: '1080p', audio: true },
  maxCostUsd: '0.50',
});

// → every result carries its canonical schema, its price, and why it matched.
//   No second schema call.

// 2. "Make it with that one."
const gen = await composio.models.create({
  userId: 'user_123',
  model: results[0].model.id,
  input: {
    prompt: 'slow orbit, shallow depth of field',
    media: { startImage: { s3key: 'uploads/astrolabe.png' } },
    durationSeconds: 8,
    resolution: '1080p',
    audio: true,
  },
});

gen.artifacts[0].s3key;   // durable, in Composio's store
gen.cost.usd;             // '0.36'
```

For an agent, the same flow runs over MCP as `COMPOSIO_SEARCH_TOOLS` →
`COMPOSIO_CREATE_MEDIA`, with `COMPOSIO_GET_TOOL_SCHEMAS` in between when the schema wasn't
inlined and `COMPOSIO_GET_GENERATION` after it for a long render. Discovery and the schema
step are **existing** Composio tools with extended payloads, so the agent surface grows by
two, not four. The wire-level spec is in `docs/04-mcp-flow.md`.

`docs/03-mcp-teardown.md` is where this contract comes from: fal needs three calls because
its search results aren't invocable; none of fal's, Higgsfield's or Runway's discovery
honours the hard constraints in the request; and only Runway validates a call before
spending on it. Those three things are the design.

---

## Rule 1 — a search result must be invocable

The result is a **model card plus a filled-in call**, not a pointer to go fetch a schema.

```jsonc
{
  "model": {
    "id": "luma_labs/ray-3",
    "provider": "luma_labs",            // an existing Composio toolkit slug
    "name": "Ray 3",
    "modality": "video",
    "capabilities": ["text-to-video", "image-to-video"],

    "envelope": {                        // the hard constraints, machine-checkable
      "durationSeconds": { "min": 1, "max": 10 },
      "resolutions": ["480p", "720p", "1080p"],
      "aspectRatios": ["16:9", "9:16", "1:1"],
      "audio": true
    },

    "media": [                           // named slots with roles (from Higgsfield)
      { "slot": "startImage", "accepts": ["image"], "required": false },
      { "slot": "endImage",   "accepts": ["image"], "required": false },
      { "slot": "references", "accepts": ["image", "video"], "max": 4 }
    ],

    "schema": {
      "canonical": "video.create@1",     // the SAME schema for every video model
      "unsupported": ["negativePrompt"], // what this one ignores
      "providerOptions": { /* JSON Schema for the escape hatch */ }
    },

    "price": { "unit": "second", "usd": "0.045", "committed": true },
    "latency": { "p50Seconds": 74, "p95Seconds": 190 },
    "instant": { "supported": true },    // runnable with no user API key
    "version": "20261101_00",
    "status": "ga"
  },

  // Priced for THIS request, not a headline rate. Safe to reserve against.
  "quote": { "maxUsd": "0.36", "etaSeconds": 74, "bounded": true },

  // Ready to pass to create(), with the request's constraints already mapped.
  "call": {
    "model": "luma_labs/ray-3",
    "input": { "durationSeconds": 8, "resolution": "1080p", "audio": true }
  },

  "why": ["meets 8s (range 1-10s)", "1080p supported", "native synced audio",
          "cheapest of 4 qualifying candidates at $0.36"],
  "pitfalls": ["ignores negativePrompt", "bills the full duration on a rejected render"]
}
```

Search inlines this for the top two or three candidates and returns a `schema_ref` for the
rest — which is not a new policy but exactly what Composio's existing
`tool_schemas[].has_full_schema` / `schema_ref` pair already does for tools. Ten full
schemas would cost more context than the whole meta-tool list they replace. So the flow is
two calls when search could afford the schema and three when it couldn't, and the agent is
told which by the payload it's holding.

Three things here are deliberate borrowings, and one is new:

- **Inline canonical schema** (Higgsfield does this with `parameters`; fal doesn't) — it
  removes the mandatory middle round trip, and an agent that would otherwise guess
  parameters now can't.
- **Named media slots with roles** (Higgsfield's `medias[].roles`) — `startImage`,
  `endImage`, `references`, `voiceSample`, `maskImage`. Roles generalize; a fixed field per
  input does not.
- **`why` / `pitfalls`** (Higgsfield's `match_reason`, and the guidance Composio's
  `session.search()` already returns for tools).
- **`call`** is the new part: the constraints from the query, already mapped into the
  model's own schema. The agent's second call is `create(result.call)` with a prompt added.
  That is as short as this flow can get without guessing.

## Rule 2 — hard constraints filter, they do not merely rank

This is the differentiator, and it's worth being blunt about why. Asked for an 8-second
clip, Higgsfield's recommender returned a 12–15s-only model first (a +1200 house-model
boost outweighing the stated duration), and fal's docs say its rank "is not a quality or
speed score" at all. Semantic similarity is table stakes; **constraint satisfaction is the
thing neither incumbent does.**

So `search` splits its input in two:

```ts
await composio.models.search({
  // soft: what it should be good at. Semantic.
  query: 'cinematic product turntable, glossy brass, shallow depth of field',

  // hard: what it must do. Boolean. Checked against `envelope`, never scored.
  requires: { durationSeconds: 8, resolution: '1080p', audio: true,
              capabilities: ['image-to-video'] },
  maxCostUsd: '0.50',
});
```

and the response accounts for everything it dropped:

```jsonc
{
  "results": [ /* only candidates that satisfy every `requires` */ ],
  "considered": 23,
  "excluded": [
    { "model": "fal_ai/veo-3",  "reason": "quote $0.64 exceeds maxCostUsd $0.50" },
    { "model": "fal_ai/kling-o3", "reason": "max duration 5s < required 8s" },
    { "model": "bfl/flux-3-video", "reason": "no native audio" }
  ],
  "relaxations": [
    { "drop": "audio", "wouldAdd": 6, "cheapestUsd": "0.12" },
    { "raise": "maxCostUsd", "to": "0.70", "wouldAdd": 2 }
  ],
  "nextStepsGuidance": ["3 models qualify. Cheapest is luma_labs/ray-3 at $0.36 …"]
}
```

`excluded` is what makes the filter trustworthy — a developer can see the thumb isn't on
the scale, and an agent can explain itself to a user. `relaxations` is what keeps a strict
filter from being a dead end: when nothing qualifies, the answer is *"nothing at 1080p with
audio under $0.50; drop audio and six models open up from $0.12"*, not an empty array. An
empty result with no path forward is how an agent gives up or, worse, invents a model id.

**Neutrality has to be designed in, not assumed.** Composio has no house model today, but
Instant's economics mean it may acquire a preferred provider tomorrow. `why`, `excluded`
and `considered` are the mechanism that keeps the ranking auditable if that happens — and
the reason to ship them from day one rather than after someone asks.

## Rule 3 — one canonical schema per modality

`video.create@1` is the same object whether it lands on Luma, Veo or Kling. Swapping
providers is one changed string.

```ts
type VideoCreateInput = {
  prompt?: string;
  media?: {                     // named slots, matching `model.media[].slot`
    startImage?: MediaRef;
    endImage?: MediaRef;
    references?: MediaRef[];
    sourceVideo?: MediaRef;
  };
  durationSeconds?: number;
  resolution?: '480p' | '720p' | '1080p' | '4k';
  aspectRatio?: string;
  audio?: boolean;
  seed?: number;
};

type MediaRef =
  | string                      // https:// URL
  | { s3key }                   // an existing Composio file
  | { path }                    // local, behind the existing upload denylist
  | { artifactId }              // ← a previous generation. No download/re-upload.
  | Blob;
```

The honesty rules matter more than the field list:

- A canonical field a model ignores is listed in `schema.unsupported`, and passing it
  returns a `warnings[]` entry — **never a silent drop, never a hard failure.** Silent
  drops are how an abstraction loses trust; hard errors are how it loses adoption.
- `providerOptions` is namespaced by provider, so retargeting a call never strips anything.
- `raw` always carries the untouched provider payload. The abstraction is never the only path.
- A model missing from the catalog stays reachable by its provider toolkit's raw tools.

`{ artifactId }` is what makes chaining not hurt: today an image→video→voice pipeline means
three expiring provider URLs and two local round trips.

## Rule 4 — creating is one call with a bounded wait

```ts
await composio.models.create({ ... })                       // waits, default 120s
await composio.models.create({ ..., wait: 'brief' })        // ~25s, then a job id
await composio.models.create({ ..., wait: 'none', webhookUrl })  // returns in ~200ms
await composio.models.get(generationId)                     // poll
```

fal's 45s bounded wait is the right idea; `'brief'` is the agent default, because handing
a model a job id and an ETA beats letting it spend five turns polling. Completion is an
ordinary Composio trigger (`media.generation.completed`), verified with the existing
`webhooks.verifyWebhook` — no per-provider JWKS handling.

Every generation returns a **recipe** (fal's idea, and a good one):

```ts
gen.recipe;  // { model: 'luma_labs/ray-3', input: {...}, canonical: 'video.create@1' }
await composio.models.create({ ...gen.recipe, input: { ...gen.recipe.input, seed: 7 } });
```

Replayable, diffable, shareable, and the unit a "regenerate with one tweak" UI is built
from. `recipe: { store: false }` redacts the input for sensitive prompts.

And because **in media a retry is a purchase** — fal's docs warn about exactly this, and
Runway bills every retry and regeneration separately — `idempotencyKey` is first-class, and
a duplicate key returns the original generation rather than buying a second one.

### Validate before the request leaves

Canonical input is checked against the model's `envelope` **locally, in the SDK**, before
anything is sent: allowed enums, numeric ranges, required fields, media slots the model
doesn't have. An envelope violation is a local `ComposioModelEnvelopeError` naming the
offending field, not a round trip and not a `422`.

This is Runway's idea, lifted intact — its MCP server validates against OpenAPI-derived
per-model constraints and *"invalid payloads fail locally with a readable error and never
hit the network."* It costs nothing to build once `envelope` exists, because it is the same
data read in the other direction, and in a domain where a rejected call is still a purchase
it is the difference between a typo and a charge.

## Rule 5 — cost is committed before it is spent

`price.committed: true` and `quote.bounded: true` mean the number is reservable, not
advisory. That is the one place this design adds a capability rather than re-indexing one:
fal's `estimate_cost` is explicitly "advisory, not a quote", and Composio's Instant docs
state there is no dollar spend cap and that charges report *after* execution.

```ts
await composio.models.create({ ..., maxCostUsd: '0.50' });
// → 409 Models_BudgetExceeded, pre-flight, nothing spent
```

Session policy, in the existing `enable`/`disable`/`requireApproval` grammar:

```ts
const session = await composio.create('user_123', {
  models: {
    modalities: { enable: ['image', 'video', 'speech'] },
    budget: { maxUsdPerCall: '0.25', maxUsdPerSession: '5.00',
              onExceeded: 'require_approval' },   // → the existing HITL input-request flow
    limits: { video: { maxDurationSeconds: 10, maxResolution: '1080p' } },
    artifacts: { store: 'composio', retentionDays: 7, mount: '/mnt/files/generations' },
  },
});
```

Unquotable models are `bounded: false`, and a strict budget rejects them rather than
guessing. If you cannot bound the cost, you cannot let an agent spend it.

---

## The agent surface: two existing tools extended, two new ones

```
COMPOSIO_SEARCH_TOOLS       (existing) + `requires` / `max_cost_usd`; results gain
                                         model_slugs, model_schemas, model_excluded
COMPOSIO_GET_TOOL_SCHEMAS   (existing) accepts model slugs — the `schema_ref` a search
                                         hands back already names this tool
COMPOSIO_CREATE_MEDIA       (NEW)      model or intent + canonical input → artifacts, or a job id
COMPOSIO_GET_GENERATION     (NEW)      poll / cancel a render
```

**+2 tools**, where fal's MCP is ~35 and Runway's 9 — not because Composio does less, but
because the rest already exists as general machinery: `upload_file` → `composio.files` and
the session mount; the asset library → artifacts; workflow planning →
`COMPOSIO_REMOTE_WORKBENCH`; account connection → `COMPOSIO_MANAGE_CONNECTIONS`; docs →
`COMPOSIO_SEARCH_TOOLS`. That is the whole point of putting this inside Composio instead of
shipping another media MCP.

Discovery deliberately does **not** get its own tool. A second search tool would force the
agent to route between them before it knows what it needs, and the boundary is genuinely
ambiguous — "generate a thumbnail and upload it to Drive" needs both kinds of result from
one query. One search, two result kinds. The reasoning and the alternatives are in
`docs/04-mcp-flow.md`; a full wire transcript is in `examples/07-mcp-transcript.md`.

## Optional: the use case *is* the model (routing)

Once discovery is constraint-aware, naming a model becomes optional:

```ts
const gen = await composio.models.create({
  userId: 'user_123',
  model: { modality: 'video', prefer: 'cheapest',
           requires: { durationSeconds: 8, resolution: '1080p', audio: true },
           maxCostUsd: '0.50' },
  input: { prompt: 'slow orbit', media: { startImage: { artifactId: 'art_7f2' } } },
});

gen.model;             // 'luma_labs/ray-3' — what actually ran
gen.routing.why;       // 'cheapest of 3 qualifying candidates'
gen.routing.excluded;  // same accounting as search
```

This is search and create fused into one call, so it inherits the same filter and the same
`excluded` accounting — which is the only reason it's safe. `models.route()` resolves an
intent **without executing**, and `pin` freezes a validated choice while keeping the
constraints as documentation. A router you can't dry-run is a router nobody ships.

---

## Architecture: what this reuses

Nothing below the API is new.

| Concern | Reuses |
|---|---|
| Auth, BYOK | The provider **is** an existing toolkit: its auth configs, `session.authorize()`, `ensureConnected()`. |
| Auth, no key | Instant. `instant.supported` per model is the existing per-tool flag. |
| Billing, metering | The Instant charge path; `cost.usd` is a normalized `instantCharge`. |
| Blobs | `composio.files` + `s3key`; the session file mount for `sandboxPath`. |
| Async, progress | `composio.triggers` / `webhooks` / the pusher channel `triggers.subscribe()` uses. |
| Approvals | `ComposioToolInputRequiredError` + `inputResponses`/`requestState`, unchanged. |
| Server-side policy | Session hooks (`resultType: 'blocked'`, `blockReason`). |
| Observability | Each generation is a tool execution underneath → one `logId`, in `composio.logs` / `composio.usage`. |
| Schema drift | Toolkit versioning for models; canonical schemas versioned separately (`video.create@1`). |
| Framework reach | The three meta tools flow through every existing provider adapter and over MCP unchanged. |
| Artifact durability | `composio.files` retention, so a result outlives the provider's CDN — Runway's expire in 24h, unrecoverably. |

Implementation: materialize each model as a hidden server-side tool, excluded from the tool
search index, with `composio.models` as the index and adapter in front. Then Instant
pricing, versioning, logging and approvals all work per model with no new code, and the
public surface stays small. See `docs/02-variations.md` for the alternatives.

## Out of scope

- **LLM text generation.** Media and perception only; routing chat completions is a
  different product with different economics.
- **Editing / timelines.** Artifacts are files with metadata; composition is the caller's.
- **Training and fine-tuning.** Stays on the per-provider toolkits where it already works.
- **New auth types.** A provider needing a key uses an existing auth config.
