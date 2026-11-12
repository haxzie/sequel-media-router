import { createVideoModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl, toBase64 } from '../_shared';

/**
 * MiniMax Hailuo 2.3.
 *
 * Priced flat per clip rather than per second, and not linearly: 6s@768p is
 * $0.28 but 10s@768p is $0.56, which is $0.047/s against $0.056/s. The generic
 * per-second estimator would get both wrong, so this model prices itself from
 * the published table.
 */
const CLIP_PRICES: Record<string, string> = {
  '6:768P': '0.28',
  '10:768P': '0.56',
  '6:1080P': '0.49',
};

export const hailuo23 = createVideoModel({
  id: 'minimax/hailuo-2.3',
  provider: 'minimax',
  name: 'Hailuo 2.3',
  description:
    'MiniMax’s Hailuo video model. Fixed 6 or 10 second clips at 768p or 1080p, from a prompt or a first frame, with a built-in prompt optimiser.',
  capabilities: ['text-to-video', 'image-to-video'],
  tags: ['cheap'],
  keywords: [
    'short clip',
    'social video',
    'animate a photo',
    'first frame',
    'product video',
    'cheap video',
  ],
  // developers.cloudflare.com/ai/models/minimax/hailuo-2.3 (read 2026-11-12)
  rates: [
    { unit: 'clip', usd: '0.28', qualifier: '6s @768p' },
    { unit: 'clip', usd: '0.49', qualifier: '6s @1080p' },
    { unit: 'clip', usd: '0.56', qualifier: '10s @768p' },
  ],
  runtime: 'ai-gateway',
  async: true,
  etaSeconds: 80,
  schemaUrl: partnerSchemaUrl('minimax', 'hailuo-2.3'),
  input: z.object({
    prompt: z.string().min(1),
    /** Upstream wants base64; `run` encodes a URL for you. */
    image_url: z
      .string()
      .optional()
      .describe('First frame for image-to-video: an https URL, base64, or a data: URI.'),
    duration: z.union([z.literal(6), z.literal(10)]).default(6),
    resolution: z.enum(['768P', '1080P']).default('768P'),
    prompt_optimizer: z.boolean().default(true),
    fast_pretreatment: z.boolean().default(false),
  }),
  estimate: (input) =>
    // 10s@1080p is not in the published table; fall back to the headline rate.
    CLIP_PRICES[`${input.duration}:${input.resolution}`] ??
    (0.047 * input.duration).toFixed(6),
  run: async (input, ctx) => {
    const { image_url, ...rest } = input;
    const result = await ctx.ai.run({
      model: 'minimax/hailuo-2.3',
      runtime: 'ai-gateway',
      input: {
        ...rest,
        ...(image_url ? { first_frame_image: await toBase64(image_url) } : {}),
      },
    });
    return {
      kind: 'video',
      assets: await collectAssets(result, ctx, { mime: 'video/mp4', ext: 'mp4' }),
      raw: result.json ?? null,
    };
  },
});
