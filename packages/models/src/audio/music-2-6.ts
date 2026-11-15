import { createAudioModel } from '@sequel/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/**
 * MiniMax Music — the only music model in the catalog.
 *
 * Billed flat per track rather than by length, with a small surcharge when the
 * lyric optimiser writes the words for you. `estimate` adds that second charge
 * so the quote matches the invoice.
 */
export const minimaxMusic = createAudioModel({
  id: 'minimax/music-2.6',
  provider: 'minimax',
  name: 'MiniMax Music 2.6',
  description:
    'Generates a full track from a style description, with optional lyrics you supply or have written for you. Vocal or instrumental.',
  capabilities: ['text-to-music', 'lyrics', 'instrumental'],
  tags: [],
  keywords: [
    'music',
    'song',
    'soundtrack',
    'background music',
    'bgm',
    'jingle',
    'theme tune',
    'instrumental',
    'lyrics',
    'compose',
  ],
  // developers.cloudflare.com/ai/models/minimax/music-2.6 (read 2026-11-12)
  rates: [
    { unit: 'track', usd: '0.15' },
    { unit: 'call', usd: '0.01', qualifier: 'per lyrics generation' },
  ],
  runtime: 'ai-gateway',
  async: true,
  etaSeconds: 60,
  schemaUrl: partnerSchemaUrl('minimax', 'music-2.6'),
  input: z.object({
    prompt: z.string().min(1).describe('Style, mood and scenario of the music.'),
    lyrics: z.string().optional().describe('Your own lyrics; use \\n between lines.'),
    lyrics_optimizer: z
      .boolean()
      .default(false)
      .describe('Write lyrics from the prompt. Adds $0.01 to the cost.'),
    is_instrumental: z.boolean().default(false).describe('No vocals.'),
    format: z.enum(['mp3', 'wav']).default('mp3'),
  }),
  // Flat per track, plus the lyric-writing surcharge when it is used.
  estimate: (input) => (0.15 + (input.lyrics_optimizer ? 0.01 : 0)).toFixed(6),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: 'minimax/music-2.6',
      runtime: 'ai-gateway',
      input,
    });
    const ext = input.format;
    return {
      kind: 'audio',
      assets: await collectAssets(result, ctx, {
        mime: ext === 'mp3' ? 'audio/mpeg' : 'audio/wav',
        ext,
      }),
      raw: result.json ?? null,
    };
  },
});
