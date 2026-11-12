import { createVideoModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/**
 * Google Veo 3.1 — the quality tier, and the price anchor for the whole market.
 *
 * Note the rate table: audio roughly doubles the per-second price, so the
 * estimator must see `generate_audio` to quote correctly. That is why the
 * qualifiers carry the word "audio" — `selectRate` matches on it.
 */
export const veo31 = createVideoModel({
  id: 'google/veo-3.1',
  provider: 'google',
  name: 'Veo 3.1',
  description:
    'Google’s flagship video model: strong motion and prompt adherence, with optional natively generated audio. The quality benchmark for text-to-video.',
  capabilities: ['text-to-video', 'image-to-video', 'synced-audio'],
  tags: ['high-fidelity'],
  keywords: [
    'cinematic video',
    'product demo',
    'advertisement',
    'b-roll',
    'tracking shot',
    'video with sound',
    'commercial',
  ],
  // developers.cloudflare.com/ai/models/google/veo-3.1 (read 2026-11-10)
  rates: [
    { unit: 'second', usd: '0.20', qualifier: '@720p' },
    { unit: 'second', usd: '0.20', qualifier: '@1080p' },
    { unit: 'second', usd: '0.40', qualifier: '@720p w/ audio' },
    { unit: 'second', usd: '0.40', qualifier: '@1080p w/ audio' },
  ],
  runtime: 'ai-gateway',
  async: true,
  etaSeconds: 90,
  schemaUrl: partnerSchemaUrl('google', 'veo-3.1'),
  input: z.object({
    prompt: z.string().min(1).describe('Text prompt describing the video to generate.'),
    image_input: z
      .string()
      .optional()
      .describe('Base64-encoded reference image, for image-to-video.'),
    duration: z.enum(['4s', '6s', '8s']).default('6s'),
    aspect_ratio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
    resolution: z.enum(['720p', '1080p']).default('720p'),
    generate_audio: z.boolean().default(true).describe('Doubles the per-second rate.'),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: 'google/veo-3.1',
      runtime: 'ai-gateway',
      input,
    });
    return {
      kind: 'video',
      assets: await collectAssets(result, ctx, { mime: 'video/mp4', ext: 'mp4' }),
    };
  },
});
