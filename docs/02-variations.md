# Variations: provider-level vs model-level, and three ways to ship either

> Read `03-mcp-teardown.md` first if you want the evidence behind the choices here —
> it tears down fal's and Higgsfield's MCP servers, which both ship this flow already.

The central question is the granularity of the new primitive. Everything else follows
from it, so take it first and on its own.

---

# Part 1 — The core fork: provider-level or model-level?

## Option A — Provider-level ("toolkits, but tidier")

The unit stays the **provider**. No new primitive; we improve what exists: normalize the
media toolkits so each exposes the same small verb set, and tag them so search can find
them.

```ts
const session = await composio.create('user_123', { toolkits: ['fal_ai'] });

// Every media toolkit gains the same four tools, in canonical form:
await session.execute('FAL_AI_GENERATE_MEDIA', {
  model: 'fal-ai/flux-2/pro',          // still a free-text string the caller must know
  modality: 'image',
  prompt: 'a brass astrolabe on dark linen',
  aspect_ratio: '3:4',
});
await session.execute('FAL_AI_LIST_MODELS',  { modality: 'image' });
await session.execute('FAL_AI_GET_PRICING',  { model: 'fal-ai/flux-2/pro' });
await session.execute('FAL_AI_GET_GENERATION', { generation_id: '...' });
```

**What it costs to build:** very little. It is toolkit curation plus a canonical schema
convention. Zero SDK surface, zero new API routes, works over MCP today, no versioning
story to invent.

**What you get:** `fal_ai`, `bfl`, `luma_labs`, `heygen`, `replicate` stop being five
unrelated shapes. A developer who already knows they want fal has a decent time. The
ElevenLabs 396-tool problem gets genuinely better, because 396 collapses to ~6 canonical
verbs plus a long tail.

**Where it breaks — and it breaks on the thing Composio is actually for:**

1. **Cross-provider questions stay unanswerable.** "Cheapest 1080p video with audio
   under $0.50" requires fanning out `LIST_MODELS` across five toolkits and reconciling
   five pricing formats client-side. The developer does the aggregation — so why use an
   aggregator?
2. **Model identity stays a magic string.** `model: 'fal-ai/flux-2/pro'` is unvalidated,
   unversioned, and invisible to search. The agent must already know it, which is exactly
   the knowledge Composio exists to not require. An LLM will confidently hallucinate
   `fal-ai/flux-pro-v2` and the error surfaces at execution.
3. **Discovery stays one level too coarse.** Search can return "fal does video." It
   cannot return "these 4 of fal's 600 models fit your constraints."
4. **No routing, ever.** Routing needs one comparable catalog. This option structurally
   cannot have one.

**Verdict:** necessary, insufficient. It is the right *first increment* and the wrong
*destination*. Note that every normalization it requires is also prerequisite work for
Option B — so it is not a fork so much as a milestone.

## Option B — Model-level (`composio.models`, the recommendation)

The unit is the **model**. `fal_ai/flux-2-pro` and `bfl/flux-2-pro` are two addressable,
searchable, comparable records with the same canonical input schema.

```ts
const { results } = await composio.models.search({
  query: 'photoreal product shot',
  requires: { modality: 'image', instant: true },
  maxCostUsd: '0.05',
});

const gen = await composio.models.create({
  userId: 'user_123',
  ...results[0].call,                      // schema already mapped — no second lookup
  input: { ...results[0].call.input, prompt: 'a brass astrolabe on dark linen' },
});
```

**What you get:** the four gaps in `00-exploration-notes.md` all close at once, because
they are all symptoms of the missing index. Discovery can filter on cost/latency/
envelope. Invocation is provider-independent, so comparison shopping and A/B become one
changed string. Routing becomes possible. Budgets become enforceable pre-flight, because
there is a per-model price to quote against.

**What it costs:** a catalog that must be curated and kept fresh across ~600 fal models,
~400 ElevenLabs tools, and whatever shipped last week. This is the real expense, and it
is ongoing rather than one-time. Mitigations: derive most of it from provider manifests
(`FAL_AI_GET_MODELS`, `FAL_AI_GET_PRICING` and the equivalents already exist and are
machine-readable), mark unverified entries `status: 'preview'` with `pricing.estimator:
true`, and let `raw` + `providerOptions` carry anything the canonical schema hasn't
caught up with. A model missing from the catalog must stay reachable by raw slug — the
abstraction must never be the *only* path.

**The second cost is abstraction drift.** Canonical schemas across providers that
genuinely differ is the hard part, and the failure mode is a leaky layer that silently
drops `negativePrompt`. The answer is the `warnings[]` + `schema.unsupported` contract in
`01-design.md`: never silently drop, never hard-fail, always report.

**Verdict:** recommended. The catalog is the product. Absent it, Composio is a thinner
wrapper over fal than fal's own SDK.

## Option C — Both, layered (what I'd actually ship)

These are not alternatives; they are tiers, and the honest answer is that B needs A's
normalization underneath it.

```
composio.models.create({ model: { modality: 'video', prefer: 'cheapest' } })      ← intent
composio.models.create({ model: 'fal_ai/veo-3' })                                  ← model-level
session.execute('FAL_AI_SUBMIT_ASYNC_JOB', { model: 'fal-ai/veo3', input: {...} })  ← provider-level
```

Each tier is a strict escape hatch downward: the router tells you which model it chose,
the model tier exposes `raw` and `providerOptions`, and the provider tier never goes away.
A developer can start at the top and descend exactly as far as their edge case demands —
which is the property that makes an abstraction safe to adopt.

## Side by side

| | A. Provider-level | B. Model-level | C. Layered |
|---|---|---|---|
| New SDK surface | none | `composio.models` (4 methods) | same as B |
| New meta tools | none | 2 (+2 extended) | 2 (+2 extended) |
| Cross-provider search | ✗ | ✓ | ✓ |
| Comparison shop / A-B | manual | one string | one string |
| Routing by cost/latency | impossible | ✓ | ✓ |
| Pre-flight budget cap | ✗ (no price index) | ✓ | ✓ |
| Catalog maintenance | low | **high, ongoing** | high |
| Abstraction-drift risk | none | real, managed via `warnings` | managed |
| Escape hatch | is the escape hatch | `raw` + `providerOptions` | all three tiers |
| Time to ship | weeks | quarters | A then B |

---

# Part 2 — Three implementation strategies for the model tier

Independent of the above: *how* models become executable.

### Strategy 1 — Model-as-synthesized-tool (recommended backend)

Materialize each model as a server-side tool (`FAL_AI__FLUX_2_PRO__GENERATE`), **excluded
from the tool search index**, and let `composio.models` be the index and adapter in front.

Everything Composio already does per tool then works per model with no new code:
Instant pricing and metering, dated versioning, `logId` and `composio.logs`,
approvals, session hooks, `tags`. The catalog explosion that makes this a bad *public*
surface is harmless when it is private.

This is the highest-leverage choice in the design: it makes the new namespace four
methods of adapter over existing infrastructure rather than a parallel execution path.

### Strategy 2 — Canonical-schema dispatcher

`models.create()` is one backend endpoint that looks up the model, transforms canonical
input into provider input, and calls the provider. Less duplication than Strategy 1,
but a second execution path that has to re-earn metering, logging, versioning and
approvals. Reasonable only if per-tool synthesis turns out to be infeasible at catalog
scale.

### Strategy 3 — Client-side adapters in the SDK

Transform in `@composio/core`, call existing passthrough tools. Ships fastest and
requires zero backend work — a legitimate way to prototype the canonical schemas against
real users. But: logic duplicated across TS and Python, every schema fix needs an SDK
release, and no server-side budget enforcement (the client is not a trust boundary).
Prototype here, don't land here.

---

# Part 3 — Adapters worth adding once the model tier exists

Cheap, high-reach, and strictly additive.

**OpenAI-compatible HTTP shim.** Point an existing OpenAI client at Composio and get
routing for free — the fastest possible adoption path for code already written.

```bash
curl https://api.composio.dev/v1/images/generations \
  -H "x-api-key: $COMPOSIO_API_KEY" \
  -d '{"model":"fal_ai/flux-2-pro","prompt":"a brass astrolabe","size":"1024x1365"}'
```

`model` accepts a Composio model id *or* an intent string (`"image:cheapest"`). Endpoints
`/v1/images/generations`, `/v1/audio/speech`, `/v1/audio/transcriptions`, plus
`/v1/videos` for the async shape. Weak on discovery, unbeatable on migration cost.

**Vercel AI SDK media provider** (`@composio/ai-sdk-media`) implementing AI SDK's
`ImageModel` / `SpeechModel` / `TranscriptionModel` interfaces:

```ts
import { experimental_generateImage as generateImage } from 'ai';
import { composioImage } from '@composio/ai-sdk-media';

const { image } = await generateImage({
  model: composioImage('image', { prefer: 'cheapest', userId: 'user_123' }),
  prompt: 'a brass astrolabe on dark linen',
});
```

One small package, and every AI-SDK app gets Composio's whole media catalog behind an
interface its developers already know.

---

# Recommendation

**Ship Option C in three phases, on Strategy 1.**

| Phase | Scope | Why this order |
|---|---|---|
| **1. Catalog** | `composio.models.{search,list,get}` + `COMPOSIO_SEARCH_TOOLS` extended with `requires`, `quote`, `call`, `why` and `excluded`. Read-only — creation stays on today's toolkit tools. | All of the value of fixing discovery, none of the risk of a new execution path. Non-breaking, independently useful, and it forces the catalog — the genuinely hard part — to be built and proven before anything depends on it. It is also where the differentiator lives: constraint-aware, auditable ranking is the thing neither fal nor Higgsfield does (`03-mcp-teardown.md`). |
| **2. Creation** | `models.create/quote`, `Generation` + `Artifact` + `Recipe`, canonical schemas for image/video/speech, the two new meta tools `COMPOSIO_CREATE_MEDIA` + `COMPOSIO_GET_GENERATION`, session `models` policy with pre-flight budget caps. | Uniform creation and artifact handling. Budget caps land with the first spending surface, not after — and `idempotencyKey` with it, because a retry here is a purchase. |
| **3. Routing + adapters** | `model` as intent, `models.route()` dry-run, `prefer`/`fallback`/`pin`; then the OpenAI shim and AI-SDK provider. | Routing needs phase-1 data to be trustworthy. Adapters are thin once 1–2 exist. |

Phase 1 is worth shipping even if 2 and 3 are never built: a searchable, priced,
constraint-filtered index of every media model across every provider is a product on its
own, and nobody has one. fal's covers fal and ranks by "Explore discovery order";
Higgsfield's has no prices and boosts house models over stated constraints.
