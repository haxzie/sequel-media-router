import { createImageModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, workersAiSchemaUrl } from '../_shared';

/** Leonardo Phoenix: coherent text and exceptional prompt adherence. */
export const phoenix = createImageModel({
  id: '@cf/leonardo/phoenix-1.0',
  provider: 'leonardo',
  name: 'Phoenix 1.0',
  description:
    'Leonardo Phoenix: text-to-image with exceptional prompt adherence and coherent in-image text, tuned for creative direction.',
  capabilities: ['text-to-image', 'text-rendering'],
  tags: ['high-fidelity'],
  keywords: [
    'prompt adherence',
    'creative direction',
    'illustration',
    'concept art',
    'product shot',
    'editorial image',
  ],
  rates: [
    { unit: 'tile_512', usd: '0.005830' },
    { unit: 'step', usd: '0.000110' },
  ],
  runtime: 'workers-ai',
  etaSeconds: 9,
  schemaUrl: workersAiSchemaUrl('phoenix-1.0'),
  input: z.object({
    prompt: z.string().min(1).max(2048),
    negative_prompt: z.string().max(2048).optional(),
    guidance: z.number().min(2).max(10).default(2),
    width: z.number().int().min(256).max(2048).default(1024),
    height: z.number().int().min(256).max(2048).default(1024),
    num_steps: z.number().int().min(1).max(50).default(25),
    seed: z.number().int().optional(),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: '@cf/leonardo/phoenix-1.0',
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
