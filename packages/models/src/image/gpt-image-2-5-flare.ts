import { createImageModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/**
 * OpenAI's fast everyday image model, reached through AI Gateway.
 *
 * Billed per token rather than per image, so the generic estimator cannot price
 * it ahead of the call — `estimate` returns zero and the task is flagged
 * `estimated` until the provider reports usage. Better an honest unknown than a
 * confident wrong number.
 */
export const gptImage25Flare = createImageModel({
  id: 'openai/gpt-image-2.5-flare',
  provider: 'openai',
  name: 'GPT Image 2.5 Flare',
  description:
    'OpenAI’s fastest high-quality everyday image model. Accepts text and up to 16 reference images for editing, with selectable quality tiers.',
  capabilities: [
    'text-to-image',
    'image-editing',
    'image-to-image',
    'transparent-background',
    'text-rendering',
  ],
  tags: ['fast', 'high-fidelity'],
  keywords: [
    'edit image',
    'reference image',
    'instruction following',
    'product photo',
    'transparent png',
    'inpaint',
    'photo edit',
  ],
  // Token-billed: $5/1M input, $30/1M output image tokens (docs, read 2026-11-10).
  rates: [{ unit: '1m_tokens', usd: '30.00', qualifier: 'output image tokens' }],
  runtime: 'ai-gateway',
  etaSeconds: 12,
  schemaUrl: partnerSchemaUrl('openai', 'gpt-image-2.5-flare'),
  input: z.object({
    prompt: z.string().min(1).describe('What to generate, or how to edit the supplied images.'),
    images: z
      .array(z.string())
      .max(16)
      .optional()
      .describe('Base64 or data: URIs to edit. Omit for pure text-to-image.'),
    quality: z.enum(['low', 'medium', 'high', 'auto']).default('auto'),
    size: z.enum(['1024x1024', '1536x1024', '1024x1536', 'auto']).default('auto'),
    output_format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  }),
  estimate: () => '0.000000',
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: 'openai/gpt-image-2.5-flare',
      runtime: 'ai-gateway',
      input,
    });
    const mime = `image/${input.output_format === 'jpeg' ? 'jpeg' : input.output_format}`;
    return {
      kind: 'image',
      assets: await collectAssets(result, ctx, {
        mime,
        ext: input.output_format,
        keys: ['images'],
      }),
      raw: result.json ?? null,
    };
  },
});
