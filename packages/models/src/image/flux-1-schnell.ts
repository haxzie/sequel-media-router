import { createImageModel } from '@sequel/core';
import { z } from 'zod/v4';
import { collectAssets, workersAiSchemaUrl } from '../_shared';

/**
 * The volume workhorse. Cheapest credible image tier on the platform and the
 * sensible default when a request carries a budget.
 */
export const fluxSchnell = createImageModel({
  id: '@cf/black-forest-labs/flux-1-schnell',
  provider: 'black-forest-labs',
  name: 'FLUX.1 [schnell]',
  description:
    'Fast, inexpensive text-to-image. Four diffusion steps by default; the default choice for drafts, thumbnails and high-volume generation.',
  capabilities: ['text-to-image'],
  tags: ['fast', 'cheap', 'open-weights'],
  keywords: [
    'image',
    'draft',
    'thumbnail',
    'concept art',
    'illustration',
    'cheap image generation',
    'bulk images',
    'fast image',
  ],
  // developers.cloudflare.com/workers-ai/platform/pricing (read 2026-11-10)
  rates: [
    { unit: 'tile_512', usd: '0.0000528' },
    { unit: 'step', usd: '0.0001056' },
  ],
  runtime: 'workers-ai',
  etaSeconds: 4,
  schemaUrl: workersAiSchemaUrl('flux-1-schnell'),
  input: z.object({
    prompt: z.string().min(1).max(2048).describe('What to draw.'),
    steps: z
      .number()
      .int()
      .min(1)
      .max(8)
      .default(4)
      .describe('Diffusion steps. Higher is slower and better; 8 is the cap.'),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: '@cf/black-forest-labs/flux-1-schnell',
      runtime: 'workers-ai',
      input,
    });
    return {
      kind: 'image',
      assets: await collectAssets(result, ctx, { mime: 'image/jpeg', ext: 'jpg' }),
      raw: result.json ?? null,
    };
  },
});
