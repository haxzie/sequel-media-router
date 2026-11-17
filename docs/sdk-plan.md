# TypeScript SDK — plan

Target shape, from the sketch:

```ts
import { Sequel } from '@sequelsh/core';
import { AISDKToolset } from '@sequelsh/ai-sdk';

const sequel = new Sequel({ apiKey: '', toolset: new AISDKToolset() });

const tools  = await sequel.tools({ models: [], type: ['image', 'video', 'audio'] });
const models = await sequel.search({ ... });
const task   = await sequel.run({ prompt: '', model: '', params: { ... } });
```

Everything below either backs that shape or says where it does not survive
contact with the server, and why.

---

## 0. Two things to fix before any SDK ships

**The REST API has no authentication.** Verified against the running server:

```
POST /api/tasks   (no credential)   → 200, model runs
GET  /api/models  (no credential)   → 200
```

An SDK whose first constructor argument is `apiKey` must be sending it
somewhere that checks it. Today it would be decoration. `/api/mcp` already
enforces credentials; the REST routes need the same `resolveActor` gate, with
the same 401 on failure. This is phase 0 and nothing else should start first.

**There is no REST route for a model's schema.** `get_model_schemas` exists
only as an MCP tool. The SDK needs `GET /api/models/:id/schema` or it has to
speak MCP to do the one thing that makes `run()` typable.

Smaller gaps, worth closing while we are there:

| Gap | Why the SDK needs it |
| --- | --- |
| No batch over REST | MCP `run_models` takes `runs`/`prompts`; REST takes one. |
| Run lives at `POST /api/tasks` | Fine, but `POST /api/run` reads better and can alias. |
| No cursor pagination on `/api/tasks` | `sequel.tasks.list()` will want it past a few hundred runs. |

---

## 1. Packages

```
@sequelsh/core        the client. No framework dependencies, ever.
@sequelsh/ai-sdk      Vercel AI SDK toolset
@sequelsh/langchain   later
@sequelsh/mastra      later
@sequelsh/types       generated catalogue types (see §3)
```

Core stays framework-free so that adding LangChain never changes what an AI
SDK user installs. The adapters depend on core, not the reverse.

## 2. The toolset argument

The sketch puts the toolset in the constructor. That works and reads well, but
a toolset is an output format rather than a property of the connection — one
client may reasonably want AI SDK tools *and* a raw `run()`.

Support both: a default on the constructor, overridable per call.

```ts
const sequel = new Sequel({ apiKey, toolset: new AISDKToolset() });

await sequel.tools({ type: ['image'] });                      // the default
await sequel.tools({ toolset: new LangChainToolset() });      // just this once
```

`Toolset` is an interface with one method — take a catalogue entry and its
JSON Schema, return whatever that framework calls a tool. Nothing in core
imports `ai`.

## 3. The hard part: what "typed" means

`sequel.run({ model, params })` with real autocomplete on `params` is the
whole value of an SDK over `fetch`. Model input schemas live in the registry
and are only known at runtime, so there are three honest options.

**A. Codegen against a live catalogue.** `npx sequel generate` emits a `.d.ts`
with a union of model ids and a params type per model. Best possible DX, exact
for private or extended catalogues, costs a build step.

**B. Ship pre-generated types.** `@sequelsh/types` is regenerated whenever the
catalogue changes and versioned with it. No user build step; drifts if the
server is ahead of the installed package.

**C. Runtime only.** `params: Record<string, unknown>`, validated server-side.
Zero ceremony, no autocomplete, and the error arrives from the network.

Recommend **B as the default, A for anyone pinned to their own catalogue**, and
C always available as the escape hatch via `run({ model: string & {} })`. The
word *typed* in the sketch is doing a lot of work and this is where it is paid
for.

## 4. `run()` — one correction

The sketch hoists `prompt` to the top level. Most models do take `prompt`,
but **text-to-speech does not** — `@cf/deepgram/aura-1` takes `text`, and
hoisting would silently produce the wrong request for every TTS model.

```ts
// Works for anything, because params is the model's own input object.
sequel.run({ model: 'openai/gpt-image-2.5-flare', params: { prompt: '…' } });
sequel.run({ model: '@cf/deepgram/aura-1',        params: { text: '…' } });

// Keep the shorthand, typed so it only appears on models that have `prompt`.
sequel.run({ model: 'openai/gpt-image-2.5-flare', prompt: '…' });
```

With generated types the shorthand can be made to vanish from autocomplete on
models whose input has no `prompt` field, which is the version worth building.

## 5. Tools: how many?

`tools({ models, type })` implies one tool per model — you only filter
because each entry costs prompt budget. Two modes, because both are right in
different places:

- **`mode: 'discovery'` (default)** — three tools: `search_models`,
  `get_model_schemas`, `run_models`. Constant prompt cost whatever the
  catalogue size, and the agent discovers at runtime. This is what the MCP
  server already does and what the chat uses.
- **`mode: 'per-model'`** — one tool per filtered model, with exact typed
  params and no discovery round trip. Good for a curated three; bad for twenty.

```ts
await sequel.tools({ type: ['image'] });                        // 3 tools
await sequel.tools({ models: ['flux-1-schnell'], mode: 'per-model' }); // 1 tool
```

## 6. Async, which is most of video

`run()` on a video model returns `status: 'in_progress'` and a `task_id`. The
SDK should not make every caller write a polling loop.

```ts
const task = await sequel.run({ … });
const done = await task.wait({ timeout: 300_000 });   // polls with backoff
```

Webhooks stay the production answer; `wait()` is for scripts and notebooks.

## 7. Auth

`apiKey` from the constructor, falling back to `SEQUEL_API_KEY`. `baseUrl`
overridable for self-hosting. OAuth is deliberately not in the SDK — it exists
for MCP clients that cannot hold a secret, and a server-side SDK can.

## 8. Order

1. **Phase 0** — authenticate the REST API; add `GET /api/models/:id/schema`.
2. **Phase 1** — `@sequelsh/core`: `search`, `run`, `tasks.get/list`, `wait`,
   `upload`. Runtime types only. Usable on its own.
3. **Phase 2** — type generation and `@sequelsh/types`.
4. **Phase 3** — `@sequelsh/ai-sdk` with both tool modes.
5. **Phase 4** — batching, pagination, further adapters.

Phase 1 is shippable alone and is what most people will actually use.

## Open questions

1. **Package scope** — `@sequelsh/*` implies the `sequel.sh` domain, which is
   a different product. Deliberate, or should this be `@sequel-media/*`?
2. **Does the SDK need org scoping?** A key resolves to its owner's first
   organisation today. If keys become org-owned, `run()` gains no argument —
   but if someone wants to pick, it needs one.
3. **Do we ship an OpenAI-compatible `/v1/images/generations`?** The research
   found no platform shipping that *plus* webhooks *plus* a normalised
   cross-modality body. It is a bigger wedge than the SDK and would change
   what the SDK wraps.
