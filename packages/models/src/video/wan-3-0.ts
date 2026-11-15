import { createVideoModel } from '@sequel/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/**
 * Alibaba Wan 3.0 — the value tier. A quarter of Veo's price at 720p, and the
 * one to route to when a request carries a budget rather than a quality floor.
 */
export const wan30 = createVideoModel({
  id: 'alibaba/wan-3.0',
  provider: 'alibaba',
  name: 'Wan 3.0',
  description:
    'Alibaba’s Wan 3.0 text-to-video. Cinematic output at 480p to 1080p with configurable duration up to 15 seconds, at a fraction of flagship pricing.',
  capabilities: ['text-to-video'],
  tags: ['cheap', 'open-weights'],
  keywords: [
    'cheap video',
    'budget video',
    'social clip',
    'long clip',
    'vertical video',
    'bulk video',
    'tiktok',
    'reel',
  ],
  // developers.cloudflare.com/ai/models/alibaba/wan-3.0 (read 2026-11-10)
  rates: [
    { unit: 'second', usd: '0.05', qualifier: '@480p' },
    { unit: 'second', usd: '0.10', qualifier: '@720p' },
    { unit: 'second', usd: '0.20', qualifier: '@1080p' },
  ],
  runtime: 'ai-gateway',
  async: true,
  etaSeconds: 75,
  schemaUrl: partnerSchemaUrl('alibaba', 'wan-3.0'),
  input: z.object({
    prompt: z.string().min(1).max(2500),
    resolution: z.enum(['480P', '720P', '1080P']).default('720P'),
    ratio: z.enum(['adaptive', '16:9', '9:16', '1:1', '4:3', '3:4']).default('16:9'),
    duration: z.number().int().min(1).max(15).default(5).describe('Seconds.'),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: 'alibaba/wan-3.0',
      runtime: 'ai-gateway',
      input,
    });
    return {
      kind: 'video',
      assets: await collectAssets(result, ctx, { mime: 'video/mp4', ext: 'mp4' }),
      raw: result.json ?? null,
    };
  },
});
