/**
 * The headline flow: describe a use case → get models → create.
 *
 * Two calls. Compare with fal's MCP, which needs three (search_models →
 * get_model_schema → run_model) because its search results aren't invocable.
 * See docs/03-mcp-teardown.md.
 */
import { Composio } from '@composio/core';
import type { ModelsNamespace } from '../spec/models.types';

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY }) as Composio & {
  models: ModelsNamespace;
};
const userId = 'user_123';

// ===========================================================================
// CALL 1 — the use case, split into a soft query and hard constraints.
// ===========================================================================
const found = await composio.models.search({
  // Soft: what it should be GOOD at. Semantic.
  query: 'cinematic product turntable from one reference photo, glossy brass, shallow DOF',

  // Hard: what it MUST do. Boolean, matched against each model's envelope.
  // A model that violates any of these is excluded and reported — never just
  // out-scored. This is the part neither fal nor Higgsfield does.
  requires: {
    modality: 'video',
    capabilities: ['image-to-video'],
    durationSeconds: 8,
    resolution: '1080p',
    audio: true,
  },
  maxCostUsd: '0.50',
  prefer: 'cheapest',
});

for (const r of found.results) {
  console.log(`${r.model.id}  $${r.quote.maxUsd}  ~${r.quote.etaSeconds}s`);
  r.why.forEach(w => console.log(`   ✓ ${w}`));
  r.pitfalls?.forEach(p => console.log(`   ! ${p}`));
}
// luma_labs/ray-3  $0.36  ~74s
//    ✓ meets 8s (range 1-10s)
//    ✓ 1080p supported
//    ✓ native synced audio
//    ✓ cheapest of 3 qualifying candidates
//    ! ignores negativePrompt
//    ! bills the full duration on a rejected render

// Everything it dropped, and why. Auditable: you can verify there is no thumb
// on the scale, and an agent can explain its choice to a user.
console.log(found.considered);  // 23
console.log(found.excluded);
// [{ model: 'fal_ai/veo-3',       reason: 'quote $0.64 exceeds maxCostUsd $0.50' },
//  { model: 'fal_ai/kling-o3',    reason: 'max duration 5s < required 8s' },
//  { model: 'bfl/flux-3-video',   reason: 'no native audio' }, ...]

// A strict filter must never be a dead end. When nothing qualifies, the answer
// is a path forward rather than an empty array.
console.log(found.relaxations);
// [{ drop: 'audio', wouldAdd: 6, cheapestUsd: '0.12' },
//  { raise: 'maxCostUsd', to: '0.70', wouldAdd: 2 }]

// ===========================================================================
// CALL 2 — create. The result already carries the mapped call; add the inputs.
// ===========================================================================
const best = found.results[0];

const gen = await composio.models.create({
  userId,
  ...best.call,                    // { model: 'luma_labs/ray-3',
                                   //   input: { durationSeconds: 8, resolution: '1080p', audio: true } }
  input: {
    ...best.call.input,
    prompt: 'slow orbit, shallow depth of field, single raking light',
    // Named media slots with roles, same keys as `best.model.media[].slot`.
    media: { startImage: { s3key: 'uploads/astrolabe.png' } },
  },
  maxCostUsd: '0.50',              // pre-flight, server-side. 409 before spending, not after.
  idempotencyKey: 'order_8831:hero',  // in media a retry is a purchase
});

console.log(gen.status, gen.model, gen.cost?.usd, gen.timings.seconds);
// 'completed' 'luma_labs/ray-3' '0.36' 71

const art = gen.artifacts[0];
console.log(art.s3key);        // generations/gen_9k3m/0.mp4  — durable, in Composio's store
console.log(art.sandboxPath);  // /mnt/files/generations/gen_9k3m/0.mp4 — the sandbox can read it
console.log(art.durationSeconds, art.width, art.height);

// Never silently dropped, never a hard failure — always reported.
gen.warnings.forEach(w => console.warn(`[${w.code}] ${w.field ?? ''} ${w.message}`));

// Replayable. The unit a "regenerate with one tweak" UI is built from.
await composio.models.create({
  userId,
  ...gen.recipe!,
  input: { ...gen.recipe!.input, seed: 7 },
});

// ---------------------------------------------------------------------------
// Optional third form: skip naming a model. Search and create fused, inheriting
// the same filter and the same `excluded` accounting — which is why it's safe.
// ---------------------------------------------------------------------------
const auto = await composio.models.create({
  userId,
  model: {
    modality: 'video',
    prefer: 'cheapest',
    requires: { durationSeconds: 8, resolution: '1080p', audio: true },
    maxCostUsd: '0.50',
    fallback: ['fal_ai/veo-3'],
  },
  input: { prompt: 'slow orbit', media: { startImage: { artifactId: 'art_7f2' } } },
});

console.log(auto.model);              // 'luma_labs/ray-3' — what actually ran
console.log(auto.routing?.why);       // ['cheapest of 3 qualifying candidates']
console.log(auto.routing?.excluded);  // same accounting as search

// ===========================================================================
// For contrast: the same task today.
// ===========================================================================
//
//   const session = await composio.create(userId, { toolkits: ['fal_ai'] });
//
//   // Which model? Search returns the TOOL, not the model — 600+ fal models hide
//   // behind one passthrough tool. You must already know the string.
//   const job = await session.execute('FAL_AI_SUBMIT_ASYNC_JOB', {
//     model: 'fal-ai/veo3/image-to-video',   // unvalidated; an LLM will hallucinate a variant
//     input: { image_url: '...', prompt: '...', duration: '8s', generate_audio: true },
//   }, { account: 'instant_account' });
//
//   // Poll yourself, with your own backoff:
//   let s; do { await sleep(2000);
//     s = await session.execute('FAL_AI_QUEUE_GET_STATUS', { request_id: job.data.request_id });
//   } while (s.data.status !== 'COMPLETED');
//
//   const out = await session.execute('FAL_AI_GET_QUEUE_REQUEST_RESULT',
//                                     { request_id: job.data.request_id });
//
//   out.data.video.url;   // provider-hosted, expiring. Download + re-upload it yourself
//                         // to keep it, or to feed it into the next model.
//   // Cost: unknown until you read it off the execution log afterwards.
//   // Cheaper alternative at another provider: you'd have to go look, by hand.
