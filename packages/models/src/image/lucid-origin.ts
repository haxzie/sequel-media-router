import { createImageModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, workersAiSchemaUrl } from '../_shared';

/** Leonardo's graphic-design model: the one to reach for when text must render. */
export const lucidOrigin = createImageModel({
  id: '@cf/leonardo/lucid-origin',
  provider: 'leonardo',
  name: 'Lucid Origin',
  description:
    'Leonardo’s sharpest text-to-image model for graphic design: strong prompt adherence, legible in-image text and full-HD renders.',
  capabilities: ['text-to-image', 'text-rendering', 'style-reference'],
  tags: ['high-fidelity'],
  keywords: [
    'graphic design',
    'poster',
    'logo',
    'typography',
    'text in image',
    'marketing asset',
    'banner',
    'social post',
  ],
  rates: [
    { unit: 'tile_512', usd: '0.006996' },
    { unit: 'step', usd: '0.000132' },
  ],
  runtime: 'workers-ai',
  etaSeconds: 9,
  schemaUrl: workersAiSchemaUrl('lucid-origin'),
  input: z.object({
    prompt: z.string().min(1).max(2048),
    guidance: z.number().min(0).max(10).default(4.5).describe('Prompt adherence strength.'),
    width: z.number().int().min(256).max(2500).default(1120),
    height: z.number().int().min(256).max(2500).default(1120),
    steps: z.number().int().min(1).max(40).default(4),
    seed: z.number().int().optional(),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: '@cf/leonardo/lucid-origin',
      runtime: 'workers-ai',
      input,
    });
    return {
      kind: 'image',
      assets: await collectAssets(result, ctx, { mime: 'image/jpeg', ext: 'jpg' }),
    };
  },
});
