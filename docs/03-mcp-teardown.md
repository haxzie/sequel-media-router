# Teardown: how fal, Higgsfield and Runway do "use case → models → create"

All three ship the exact flow we want, in three different shapes. Reading them is the
cheapest way to get the contract right, and each has a specific weakness worth not
inheriting.

Sources: fal's MCP docs (`fal.ai/docs/documentation/setting-up/mcp`) and tool listing
(`fal.ai/mcp`); Higgsfield's MCP introspected and **called live** from this session;
Runway's MCP help centre, its archived `runwayml/runway-api-mcp-server` tool table, and
Composio's own `runway` toolkit page. All read 2026-11-10.

**The three shapes, in one line each:**

| | Unit of invocation | Tools | Model choice |
|---|---|---|---|
| fal | the model | ~35 | required, a free-text `endpoint_id` |
| Higgsfield | the model | ~10 for media | required, with a rich recommender |
| **Runway** | **the capability** | **9** | **optional, defaults to a recommended model** |

---

## fal MCP

Hosted at `mcp.fal.ai/mcp-relay`, OAuth browser sign-in, server free and you pay for runs.
Launched with 9 tools. It is now ~35, grouped as Discover / Price and account / Generate /
Workflows.

**The happy path is three calls:**

```
search_models({ query: "video generation", category: "image-to-video" })
  → { models: [{ endpoint_id, name, category, description }], next_cursor }
     ^^ id, name, category, description. That is all.

get_model_schema({ endpoint_id: "fal-ai/flux/dev" })
  → full provider input/output schema

run_model({ endpoint_id, input: { prompt, image_size } })
  → bounded wait, 45s default: `completed` + result, or `processing` + request_id
     + status_url, then check_job → get_job_result
```

**Worth copying:**

- **`run_model`'s bounded wait.** 45s, then degrade to a request id with `status_url` and
  a `poll_after_seconds` hint. This is the right default for an agent: most images finish
  inside it, and nothing hangs. The docs also warn explicitly not to re-submit as a
  progress check, because *another `run_model` call creates a new billable job* — a sharp
  reminder that in media, a retry is a purchase.
- **The response `recipe`.** Every `run_model`/`submit_job` response echoes
  `{ endpoint_id, input }`, so a result is replayable and shareable without reconstructing
  it. `store_payload: false` redacts it to `input_omitted: true` for sensitive prompts.
  Cheap to build, disproportionately useful. (There is a `get_job_recipe` tool too.)
- **Batched pricing.** `get_pricing` takes *up to 50 model ids* in one call, cached 5 min,
  with `retry_after_seconds` on throttle. Comparison shopping needs batch pricing or it
  costs N round trips.
- **A real upload story.** `upload_file` handles public URL, base64 (<1MB), or a signed
  PUT up to 90MB, and is blunt that "the hosted server cannot read a local path".

**Worth not inheriting:**

1. **Discovery doesn't rank on anything you care about.** fal's own docs: *"Candidate rank
   follows Explore discovery order; it is not a quality or speed score."* So `recommend_model`
   answers "what exists for this task", not "what should I use". The constraints a developer
   actually has — under $0.50, 1080p, 8 seconds, with audio — do not participate in ranking.
2. **`estimate_cost` is "advisory, not a quote".** There is no committed number to reserve
   budget against, and separately `run_model` is a billable purchase. Advisory pricing plus
   billable retries is a bad combination to leave to an agent's judgement.
3. **Search results can't be invoked.** `search_models` returns four fields, none of them a
   schema, so `get_model_schema` is mandatory before every first run. Three round trips
   minimum, and an agent that skips the middle one guesses parameters and fails.
4. **35 tools.** Having grown 9 → 35, fal now spends a large slice of a client's tool budget.
   Some of that growth is real capability (asset library, workflow planning), but it is the
   cost of putting every verb in the tool list.
5. **Single provider.** Structurally: fal's MCP recommends fal models. Fine for fal, and
   exactly the gap an aggregator exists to fill.

---

## Higgsfield MCP

Richer and more opinionated. `models_explore` carries four actions in one tool —
`list | search | get | recommend` — plus `apps_search` → `apps_describe` → `apps_invoke`
for marketplace apps, and `generate_image` / `generate_video` / `generate_audio` as direct
verbs.

**The live call.** I asked for *"8 second product turntable video from a single reference
photo, with synced audio, 1080p"*:

```
models_explore({ action: "recommend", query: "<the use case>", limit: 4 })
```

and each item came back **ready to invoke**:

```jsonc
{
  "id": "seedance_2_5", "name": "Seedance 2.5", "provider_name": "Bytedance",
  "output_type": "video",
  "parameters": [                                  // full schema, inline
    { "name": "duration",    "type": "number", "min": 4, "max": 30, "default": 5 },
    { "name": "resolution",  "type": "string", "options": ["480p","720p","1080p"] },
    { "name": "generate_audio", "type": "bool", "default": true },
    { "name": "mode", "options": ["t2v","omni_reference","video_edit","video_extension"] }
  ],
  "medias": [                                      // named slots, with roles
    { "name": "medias", "type": "image",
      "roles": ["start_image","end_image","image_references",
                "video_references","audio_references"] }
  ],
  "aspect_ratios": ["auto","21:9","16:9","4:3","1:1","3:4","9:16"],
  "tags": ["text-to-video","reference","1080p","unlim"],
  "supports_unlim": true,
  "score": 320,
  "match_reason": "video: tags+40, description+30; reference: tags+40; 1080p: tags+40; …"
}
```

**Worth copying — three ideas, all good:**

- **Search results carry their invocation schema.** `parameters` with types, defaults,
  options and min/max arrives with the recommendation. This collapses fal's three calls to
  two, and it is the single biggest DX difference between the two servers.
- **Named media slots with roles.** `medias: [{ name, type, roles: [start_image, end_image,
  image_references, audio_references] }]` generalizes far better than a fixed field per
  input. "First frame", "last frame", "style reference", "voice sample" are *roles*, and
  modelling them as roles is what lets one canonical schema cover text-to-video,
  image-to-video, video-extension and reference-conditioned generation without a new field
  each time.
- **`match_reason`.** Per-candidate, itemized, auditable. Any recommender that won't explain
  itself is unusable in production, and this is a model of how cheap explaining can be.
- Plus `duration_range: {min, max}` as a first-class envelope field, and a top-level
  entitlement block (`unlim: { available, remaining, expires_at }`) so the agent knows what
  it can afford *before* choosing.

**Worth not inheriting — and this one is load-bearing:**

**The ranking is not constraint-aware, and house models win anyway.** In the call above the
top result, `marketing_studio_video`, scored **1480** against Seedance's **320** — and its
`duration_range` is `{min: 12, max: 15}`, so **it cannot produce the 8-second clip I asked
for.** Its own `match_reason` says why it won: `feature-or-product-intent:
marketing-video-model-priority+1200`. A first-party priority boost of +1200 outweighed a
hard, explicitly stated constraint. Seedance — which does 4–30s at 1080p with audio — came
fourth.

(One observed call, not a benchmark. But the mechanism is visible in the response itself,
which is the point: the boost is structural, not a ranking fluke.)

Also: there is no price anywhere in the response. Cost lives in a separate credits/
entitlement model, so "cheapest option that meets these constraints" is not expressible.

---

## Runway MCP

Three endpoints, worth disentangling before anything else:

| URL | What it is |
|---|---|
| `mcp.runwayml.com/mcp` | The **product** MCP. OAuth sign-in with a Runway app account, no API key, spends Runway credits. |
| `dev.runwayml.com/mcp` | The **developer platform** MCP (`dev.runwayml.com/agents`), API-key billing. |
| `mcp.runway.team` | **A different company.** Runway (runway.team) does mobile release management. Easy to grab by mistake. |

The standalone `runwayml/runway-api-mcp-server` repo was **archived on 2026-09-30** in
favour of the two hosted endpoints, but its README is the only published tool table, and
the hosted servers are built on the same API.

**Shape: capability-first, not model-first.** Nine tools, one per verb:

```
runway_listModels      → models per capability + the recommended default for each
runway_generateVideo   → promptImage, promptText?, ratio, duration, model?
runway_generateImage   → promptText, referenceImages, ratio, model?
runway_generateAudio   → promptText, voice?, model?
runway_editVideo       → videoUri, referenceImages, promptText, model?
runway_upscaleVideo    → videoUri, model?
runway_getTask / runway_cancelTask / runway_getOrg
```

`model` is **optional on every generation tool**, defaulting to a recommended model per
capability (Nano Banana Pro for images, Seedance for video, Aleph for video editing). This
is the most important datum in the whole teardown: **Runway already ships intent-first
invocation as the default**, which is strong external validation for the `model: 'video'`
shorthand and the router in `01-design.md` — and evidence that developers accept a
platform choosing for them, provided the override exists.

It is also how nine tools cover what takes fal thirty-five. Collapsing the catalog into
verbs is a real simplification, not just a smaller surface.

**Worth copying — one idea that's better than anything in the other two:**

> *"Before any generation request is sent to the Runway API, the server validates the
> payload against OpenAPI-derived per-model constraints (allowed enums, numeric ranges,
> string lengths, required fields). Invalid payloads fail locally with a readable error and
> never hit the network."*

Pre-flight validation against per-model constraints, client-side, with a readable error.
This is the **enforcement counterpart to the `envelope`** in our design: `envelope` is the
declaration, and this is what makes a violation impossible rather than merely discouraged.
In a domain where a rejected call is still a purchase, failing locally is worth real money.
Adopt it — `create()` should validate canonical input against the model's envelope before
the request leaves, and an `envelope` violation should be a local error, not a `422`.

Note what this implies, though: validation needs the constraints, and the constraints come
from `runway_listModels`, which the README says to "call it before choosing a
`ratio`/`duration`". So Runway is a two-call flow too — discovery is not optional, it is
just better signposted.

**Worth not inheriting:**

1. **Artifacts expire in 24 hours, unrecoverably.** The README: *"Images generated by the
   Runway API live only for 24 hours at the generated link. There is no way to recover them
   after this link expires."* The clearest possible argument for persisting artifacts into
   Composio's own file layer rather than passing provider URLs around.
2. **Governance is prompt-level.** Runway's documented answer to "approve generations before
   they use credits" is to *tell your assistant in the chat*: "Always ask me before you
   start any generation with Runway." The alternative offered is ChatGPT's per-plugin
   "Always ask" setting. Both are real advice, and neither is enforcement — an instruction
   in a chat is not a spend control. Server-side `maxUsdPerCall` and `requireApproval` exist
   for exactly this.
3. **The MCP path costs more than the app path.** MCP supports Credits Mode only: Unlimited
   Mode is unavailable even on Pro and Max plans that include it, so *"a generation that is
   free in Unlimited Mode in the Runway app, such as an upscale, still costs credits when it
   runs through MCP."* Retries and regenerations are separately billed. Agentic access is
   priced worse than human access — worth knowing when the cheapest route to a model is
   through someone's existing subscription.
4. **No prices in the protocol.** Cost is credits, resolved out-of-band against your plan,
   so "cheapest model meeting these constraints" is unanswerable here too.
5. **Entitlement-gated catalog.** Which models an agent can reach depends on the user's
   Runway plan, so the same request succeeds or fails per account.

**And the strategic point:** Runway's MCP FAQ says agents can use *"Seedance 2.0, Kling,
Gen-4.5, Veo, GPT image 2, Nano Banana Pro and more."* Runway is no longer serving only
Runway models. fal, Higgsfield and Runway are all converging on aggregation. So "we have
many models" cannot be Composio's differentiator — **constraint-aware neutral selection,
plus the surrounding platform (auth, artifacts, budgets, sandbox, logs), is.**

### What Composio already has, and what's missing from it

Composio ships a `runway` toolkit today: **22 tools**, API-key auth, latest version
`20261014_00` — `RUNWAY_GENERATE_IMAGE`, `RUNWAY_GENERATE_VIDEO_FROM_IMAGE`,
`RUNWAY_GENERATE_VIDEO_FROM_TEXT`, `RUNWAY_GENERATE_SPEECH`,
`RUNWAY_GENERATE_SOUND_EFFECT`, `RUNWAY_TRANSFORM_VIDEO`, `RUNWAY_UPSCALE_IMAGE`,
`RUNWAY_UPSCALE_VIDEO`, `RUNWAY_GET_TASK`, `RUNWAY_CANCEL_TASK`, `RUNWAY_RUN_WORKFLOW`,
and document/workflow management.

It is the same capability-first shape as Runway's own MCP, which is a good sign. Two things
are missing, and both are exactly what this design adds:

- **No `listModels` equivalent.** Runway's own MCP has `runway_listModels` precisely because
  valid `ratio` and `duration` values are *model-specific*. Composio's toolkit has no tool
  that returns them, so the optional `model` parameter is a blind string and the agent
  cannot discover a legal `ratio`/`duration` pair. The model-discovery gap is not
  hypothetical — it is sitting in the catalog right now.
- **No Instant support.** The toolkit page carries no Instant badge, unlike `fal_ai` (which
  has it on `SUBMIT_ASYNC_JOB` and `GET_QUEUE_REQUEST_RESULT`). So Runway needs the user's
  own key, while fal does not — a difference the model card's `instant.supported` surfaces
  per model, and a factor in which model a constraint-aware search should prefer.

---

## What this tells us to build

| | fal | Higgsfield | Runway | Composio should |
|---|---|---|---|---|
| Calls to first result | 3 (search → schema → run) | 2 (recommend → invoke) | 2 (listModels → generate) | **2** |
| Search result invocable | ✗ ids only | ✓ inline `parameters` | ✓ per-capability + defaults | ✓ inline, and **canonical** |
| Rank honours hard constraints | ✗ "not a quality or speed score" | ✗ house boost outranked a violated constraint | n/a — picks a default | ✓ **violators excluded, not demoted** |
| Explains its choice | partial | ✓ `match_reason` | ✗ | ✓ `why` + `excluded[]` |
| Price in discovery | separate call, "advisory" | absent | absent (credits) | ✓ **inline, batched, committed quote** |
| Pre-flight validation | ✗ | ✗ | ✓ **local, per-model, readable** | ✓ copy Runway |
| Media inputs | per-model fields | ✓ named slots + roles | per-verb fields | ✓ slots + roles, canonical |
| Artifact durability | CDN, `expiration_seconds` | library | **24h, unrecoverable** | ✓ durable in `composio.files` |
| Spend control | advisory estimate | credits/entitlement | **"tell your assistant to ask first"** | ✓ server-side cap + approval |
| Replay | ✓ `recipe` | — | — | ✓ `recipe` |
| Bounded wait | ✓ 45s | ✓ queued + widget poll | task polling | ✓ ~25s then job id |
| Tool budget | ~35 | ~10 for media | **9** | **+2** (discovery and schema reuse existing tools) |
| Providers | fal only | Higgsfield + partners | Runway + Seedance/Kling/Veo/… | **all of them** |
| Model choice | required | required | **optional, with a default** | ✓ optional (intent) |

Four things fall out, and they are the whole product thesis:

1. **Constraint-aware ranking is the differentiator, not semantic search.** Both incumbents
   do semantic matching well and constraint satisfaction not at all. "8 seconds, 1080p,
   audio, under $0.50" is a *filter* — a candidate that violates it must be excluded and
   reported as excluded, never merely out-scored. This is also the one thing an aggregator
   is structurally better placed to do than a first-party platform, because it has no house
   model to promote.
2. **Neutrality is a feature you have to design for.** It is not enough to lack a house
   model; the ranking has to be inspectable (`why`, `rejected[]`, `considered`) so a
   developer can verify there is no thumb on the scale. If Composio ever gets a preferred
   provider — and Instant's economics make that likely — this is what keeps it honest.
3. **Two new tools, not thirty-five.** Composio already has the machinery fal spent 26
   extra tools on: `upload_file` → `composio.files` + the session mount; the asset library →
   artifacts; workbench/workflow planning → `COMPOSIO_REMOTE_WORKBENCH`; connections →
   `COMPOSIO_MANAGE_CONNECTIONS`. It also already has the search → schema → execute flow
   *with* adaptive schema inlining, so models join `COMPOSIO_SEARCH_TOOLS` and
   `COMPOSIO_GET_TOOL_SCHEMAS` rather than duplicating them. Only creation and polling are
   genuinely new. Runway gets to nine by collapsing the catalog into verbs; we get to two by
   collapsing the verbs into one `create` over a canonical schema. See `04-mcp-flow.md`.

4. **Validate locally, before the request leaves.** Runway's pre-flight check against
   per-model constraints is the only mechanism in any of the three that makes an invalid —
   and still billable — call impossible rather than merely unlikely. It is also free to
   build once the `envelope` exists, since it is the same data read in the other direction.
   And since all three incumbents are converging on aggregation, the moat is not catalog
   size; it is being the one that won't let an agent waste money.
