/**
 * Two things that are disproportionately painful today:
 *   (a) chaining models, because every hop is a provider URL round trip;
 *   (b) long renders, because every provider has its own async shape.
 */
import { Composio } from '@composio/core';
import type { ModelsNamespace, Generation } from '../spec/models.types';

const composio = new Composio() as Composio & { models: ModelsNamespace };
const userId = 'user_123';

// ===========================================================================
// (a) Artifact chaining: image → video → voiceover, bytes never leaving Composio.
// ===========================================================================

const still = await composio.models.create({
  userId,
  model: 'image',                                  // balanced intent shorthand
  input: { prompt: 'a brass astrolabe on dark linen', aspectRatio: '16:9' },
});

const clip = await composio.models.create({
  userId,
  model: { modality: 'video', prefer: 'best', maxCostUsd: '1.00' },
  input: {
    // The whole point. No download, no re-upload, no expiring URL, no base64.
    // Compare: today this is GET the fal URL → write to disk → FAL_AI_UPLOAD_FILE
    // (or LUMA_… upload, different shape) → pass the new URL.
    media: { startImage: { artifactId: still.artifacts[0].id } },
    prompt: 'slow orbit, shallow depth of field',
    durationSeconds: 8,
    resolution: '1080p',
  },
});

const voice = await composio.models.create({
  userId,
  model: 'elevenlabs/eleven-v3',
  input: { text: 'Hand-finished brass. Built to outlast you.', voice: 'rachel', format: 'mp3' },
});

// Mix down in the session sandbox — the artifacts are already mounted there,
// so this is a one-liner over COMPOSIO_REMOTE_BASH_TOOL rather than a transfer job.
const session = await composio.create(userId);
await session.execute('COMPOSIO_REMOTE_BASH_TOOL', {
  command:
    `ffmpeg -i ${clip.artifacts[0].sandboxPath} -i ${voice.artifacts[0].sandboxPath} ` +
    `-c:v copy -shortest /mnt/files/generations/final.mp4`,
});

// Any media slot accepts any of these `MediaRef` forms, interchangeably:
void [
  'https://example.com/ref.png',          // URL
  { s3key: 'uploads/ref.png' },           // existing Composio file
  { path: './ref.png' },                  // local, behind the existing upload denylist
  { artifactId: still.artifacts[0].id },  // a prior generation
];

// ===========================================================================
// (b) Long renders: submit + webhook. One shape for every provider.
// ===========================================================================

const job = await composio.models.create({
  userId,
  model: { modality: 'video', prefer: 'best' },
  input: { prompt: 'a city at dusk, drone descent', durationSeconds: 20, resolution: '4k' },
  wait: 'none',                                // returns in ~200ms
  webhookUrl: 'https://myapp.com/hooks/composio',
  idempotencyKey: 'order_8831:hero_render',    // in media a retry is a purchase
});
console.log(job.id, job.status);              // 'gen_…' 'queued'  — returns in ~200ms

// Option 1: await it anyway, if you have somewhere to park the promise.
const done: Generation = await job.wait({ timeoutSeconds: 600 });
console.log(done.artifacts[0].s3key);

// Option 2: pick it up in the webhook. Same verification helper as every other
// Composio webhook — no provider-specific JWKS handling (cf. FAL_AI_GET_JWKS).
export async function handler(req: Request) {
  const { valid, payload } = await composio.webhooks.verifyWebhook({
    body: await req.text(),
    headers: Object.fromEntries(req.headers),
    secret: process.env.COMPOSIO_WEBHOOK_SECRET!,
  } as never);
  if (!valid) return new Response('bad signature', { status: 401 });

  switch ((payload as { type: string }).type) {
    case 'media.generation.completed': { /* payload.generation.artifacts */ break; }
    case 'media.generation.failed':    { /* payload.generation.error.retryable */ break; }
  }
  return new Response('ok');
}

// Option 3: progress, over the channel `triggers.subscribe()` already uses.
await composio.triggers.subscribe(
  event => console.log(event.payload),   // { stage: 'rendering', percent: 62 }
  { triggerSlug: ['MEDIA_GENERATION_PROGRESS'], userId } as never,
);

// Cancellation maps onto the per-provider cancel each toolkit already has.
await composio.models.generations.cancel(job.id);
