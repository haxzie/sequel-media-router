import { createVideoModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/** xAI Grok Imagine — cheapest video on the platform, with native audio. */
export const grokImagineVideo = createVideoModel({
  id: 'xai/grok-imagine-video',
  provider: 'xai',
  name: 'Grok Imagine Video',
  description:
    'xAI’s video model. Generates, edits and extends video from text or an image, with natively synchronised dialogue, sound effects and music.',
  capabilities: ['text-to-video', 'image-to-video', 'video-extend', 'synced-audio'],
  tags: ['cheap', 'fast'],
  keywords: [
    'cheap video with audio',
    'extend video',
    'animate image',
    'meme video',
    'short clip',
    'sound effects',
    'dialogue',
  ],
  // developers.cloudflare.com/ai/models/xai/grok-imagine-video (read 2026-11-10)
  rates: [
    { unit: 'second', usd: '0.05', qualifier: '@480p' },
    { unit: 'second', usd: '0.07', qualifier: '@720p' },
  ],
  runtime: 'ai-gateway',
  async: true,
  etaSeconds: 60,
  schemaUrl: partnerSchemaUrl('xai', 'grok-imagine-video'),
  input: z.object({
    prompt: z.string().min(1),
    /**
     * Friendlier than upstream's nested `image: { url }`, and mapped to it in
     * `run`. Supplying it switches the operation to image-to-video.
     */
    image_url: z.string().url().optional().describe('Animate this image instead of text-only.'),
    resolution: z.enum(['480p', '720p']).default('720p'),
    duration: z.number().int().min(1).max(15).default(6),
    aspect_ratio: z
      .enum(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'])
      .default('16:9'),
  }),
  run: async (input, ctx) => {
    const { image_url, ...rest } = input;
    const result = await ctx.ai.run({
      model: 'xai/grok-imagine-video',
      runtime: 'ai-gateway',
      input: {
        ...rest,
        _operation: image_url ? 'edit' : 'generate',
        ...(image_url ? { image: { url: image_url } } : {}),
      },
    });
    return {
      kind: 'video',
      assets: await collectAssets(result, ctx, { mime: 'video/mp4', ext: 'mp4' }),
      raw: result.json ?? null,
    };
  },
});
