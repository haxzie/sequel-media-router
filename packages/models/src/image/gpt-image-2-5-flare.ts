import { createImageModel } from '@sequel/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl, toBase64 } from '../_shared';

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
      .describe(
        'Images to edit or use as reference: a URL, a data: URI, or raw base64. ' +
          'URLs are fetched and inlined for you. Omit for pure text-to-image.',
      ),
    background: z
      .enum(['transparent', 'opaque', 'auto'])
      .default('auto')
      .describe(
        'Set transparent to cut the subject out of its background. The output ' +
          'format must be png or webp for the alpha channel to survive.',
      ),
    quality: z.enum(['low', 'medium', 'high', 'auto']).default('auto'),
    size: z.enum(['1024x1024', '1536x1024', '1024x1536', 'auto']).default('auto'),
    output_format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  }),
  estimate: () => '0.000000',
  run: async (input, ctx) => {
    /*
     * The provider takes inline bytes, not links.
     *
     * Everything that produces an image here — a model run, an attachment, an
     * upload — hands back a URL, so an agent naturally passes one and the
     * provider answers with an unexplained failure. Fetch and encode instead,
     * the same way the video models already do with their reference frames.
     */
    const images = input.images?.length
      ? await Promise.all(input.images.map((image) => toBase64(image)))
      : undefined;

    const result = await ctx.ai.run({
      model: 'openai/gpt-image-2.5-flare',
      runtime: 'ai-gateway',
      input: { ...input, ...(images ? { images } : {}) },
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
