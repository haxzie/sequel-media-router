import { createVideoModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/**
 * MiniMax H3 Max.
 *
 * Upstream takes a `content` block array rather than a prompt string — text,
 * image_url and video_url entries, each with an optional role. That is a richer
 * interface than the rest of the catalog, so this exposes the familiar
 * prompt + image_url pair and assembles the array in `run`. Pass `content`
 * directly when you need the full expressiveness.
 */
export const minimaxH3Max = createVideoModel({
  id: 'minimax/h3-max',
  provider: 'minimax',
  name: 'MiniMax H3 Max',
  description:
    'MiniMax’s frontier video model. Cinematic motion at 768p or 2K from text, a first or last frame, or reference images.',
  capabilities: ['text-to-video', 'image-to-video'],
  tags: ['cheap', 'fast'],
  keywords: [
    'cinematic video',
    'camera movement',
    'animate image',
    'first frame',
    'last frame',
    'reference image',
    'cheapest video',
    'bulk video',
    'draft video',
  ],
  // developers.cloudflare.com/ai/models/minimax/h3 (read 2026-11-12)
  rates: [
    { unit: 'second', usd: '0.05', qualifier: '@480p' },
    { unit: 'second', usd: '0.08', qualifier: '@768p' },
  ],
  runtime: 'ai-gateway',
  async: true,
  etaSeconds: 70,
  schemaUrl: partnerSchemaUrl('minimax', 'h3-max'),
  input: z.object({
    prompt: z.string().min(1).max(7000).optional().describe('Ignored when `content` is given.'),
    image_url: z.string().url().optional().describe('Image to drive the shot.'),
    image_role: z.enum(['first_frame', 'last_frame', 'reference_image']).default('first_frame'),
    /** The upstream interface, for callers who want multi-image or video input. */
    content: z
      .array(z.record(z.string(), z.unknown()))
      .min(1)
      .optional()
      .describe('Raw upstream content blocks. Overrides prompt and image_url.'),
    duration: z.number().int().min(1).max(10).default(5),
    resolution: z.enum(['480P', '768P']).default('480P'),
    ratio: z.enum(['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16']).default('16:9'),
  }),
  run: async (input, ctx) => {
    const { prompt, image_url, image_role, content, ...rest } = input;
    const blocks =
      content ??
      [
        ...(prompt ? [{ type: 'text', text: prompt }] : []),
        ...(image_url
          ? [{ type: 'image_url', image_url: { url: image_url }, role: image_role }]
          : []),
      ];

    if (blocks.length === 0) {
      throw new Error('Supply a prompt, an image_url, or raw content blocks.');
    }

    const result = await ctx.ai.run({
      model: 'minimax/h3-max',
      runtime: 'ai-gateway',
      input: { ...rest, content: blocks },
    });
    return {
      kind: 'video',
      assets: await collectAssets(result, ctx, { mime: 'video/mp4', ext: 'mp4' }),
      raw: result.json ?? null,
    };
  },
});
