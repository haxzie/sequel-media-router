/**
 * The same task at each tier of granularity, so the tradeoff is concrete.
 *
 * Task: "make an 8-second 1080p clip with synced audio from this product still,
 *        for under $0.50, as cheaply as possible."
 *
 * See docs/02-variations.md for the analysis. The point of this file is that all
 * three tiers coexist, and each is a strict escape hatch downward.
 */
import { Composio } from '@composio/core';
import type { ModelsNamespace } from '../spec/models.types';

const composio = new Composio() as Composio & { models: ModelsNamespace };
const userId = 'user_123';
const still = { s3key: 'uploads/astrolabe.png' };

// ===========================================================================
// TIER 3 — Provider-level (Option A). Available today, and never goes away.
// You pick the provider and the model string. Composio handles auth + transport.
// ===========================================================================
{
  const session = await composio.create(userId, { toolkits: ['fal_ai', 'luma_labs'] });

  // To compare on price you fan out across providers yourself and reconcile
  // five different pricing shapes client-side. This is the aggregation an
  // aggregator was supposed to do for you.
  const falModels = await session.execute('FAL_AI_GET_MODELS', { category: 'video' });
  const falPrices = await session.execute('FAL_AI_GET_PRICING', { model: 'fal-ai/veo3' });
  void falModels; void falPrices;
  // luma_labs has 11 tools and a different pricing shape again. bfl, a third.

  const job = await session.execute(
    'FAL_AI_SUBMIT_ASYNC_JOB',
    {
      model: 'fal-ai/veo3/image-to-video',
      input: { image_url: 'https://...', prompt: 'slow orbit', duration: '8s', generate_audio: true },
    },
    { account: 'instant_account' },
  );
  void job; // then poll FAL_AI_QUEUE_GET_STATUS yourself

  // Good when: you want a fal-only feature, or a model that landed this morning
  // and isn't in the catalog yet. Bad when: you want to comparison shop.
}

// ===========================================================================
// TIER 2 — Model-level (Option B). One canonical schema, any provider.
// Swapping providers is one changed string.
// ===========================================================================
{
  const { results } = await composio.models.search({
    query: 'image-to-video, product turntable, synced audio',
    requires: {
      modality: 'video',
      capabilities: ['image-to-video'],
      durationSeconds: 8,
      resolution: '1080p',
      audio: true,
    },
    maxCostUsd: '0.50',
  });

  // Now this is answerable, and in one request:
  // Every result already satisfies the constraints — violators were excluded, not
  // ranked down — so "cheapest" is a one-line sort over a quote, not a re-filter.
  const cheapest = results
    .filter(r => !r.blockers?.length)
    .sort((a, b) => Number(a.quote.maxUsd) - Number(b.quote.maxUsd))[0].model;

  const gen = await composio.models.create({
    userId,
    model: cheapest.id, // 'luma_labs/ray-3' — or 'fal_ai/veo-3', same call shape
    input: {
      media: { startImage: still },
      prompt: 'slow orbit, shallow depth of field',
      durationSeconds: 8,
      resolution: '1080p',
      audio: true,
    },
    maxCostUsd: '0.50',
  });

  console.log(gen.model, gen.cost?.usd, gen.artifacts[0].s3key);
}

// ===========================================================================
// TIER 1 — Intent-level (the router). You state the constraint, not the model.
// ===========================================================================
{
  const gen = await composio.models.create({
    userId,
    model: {
      modality: 'video',
      capabilities: ['image-to-video'],
      prefer: 'cheapest',
      maxCostUsd: '0.50',
      requires: { durationSeconds: 8, resolution: '1080p', audio: true },
      fallback: ['fal_ai/veo-3'], // if the primary provider is degraded
    },
    input: { media: { startImage: still }, prompt: 'slow orbit', durationSeconds: 8, audio: true },
  });

  // Routing is never opaque — that failure mode is a silent 10x cost change.
  console.log(gen.model);              // 'luma_labs/ray-3'
  console.log(gen.routing?.why);       // ['cheapest of 3 qualifying candidates']
  console.log(gen.routing?.excluded);  // [{ model: 'fal_ai/veo-3', reason: 'quote $0.64 > cap $0.50' }, ...]
}

// ---------------------------------------------------------------------------
// Dry-run the router. Non-negotiable: nobody ships an un-inspectable router.
// ---------------------------------------------------------------------------
const decision = await composio.models.route({
  model: { modality: 'video', prefer: 'fastest', requires: { audio: true } },
  input: { media: { startImage: still }, durationSeconds: 8 },
});
console.log(decision.chose, decision.why, decision.considered, decision.excluded);

// Once validated in staging, freeze it — keeping the constraints as documentation
// of *why* this model, and a tripwire if it stops meeting them.
void { model: { modality: 'video', prefer: 'fastest', pin: decision.chose } };
