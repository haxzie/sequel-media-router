import { createAudioModel } from '@sequel/core';
import { z } from 'zod/v4';
import { collectAssets, workersAiSchemaUrl } from '../_shared';

/** Deepgram Aura — context-aware TTS with twelve named voices. */
export const aura1 = createAudioModel({
  id: '@cf/deepgram/aura-1',
  provider: 'deepgram',
  name: 'Aura 1',
  description:
    'Deepgram’s text-to-speech model. Context-aware pacing and expressiveness across twelve named voices, with selectable audio encodings.',
  capabilities: ['text-to-speech', 'voice-selection'],
  tags: ['fast'],
  keywords: [
    'voiceover',
    'narration',
    'speech',
    'read aloud',
    'audiobook',
    'ivr',
    'podcast voice',
    'tts',
  ],
  // developers.cloudflare.com/workers-ai/platform/pricing (read 2026-11-10)
  rates: [{ unit: '1k_characters', usd: '0.015' }],
  runtime: 'workers-ai',
  etaSeconds: 3,
  schemaUrl: workersAiSchemaUrl('aura-1'),
  input: z.object({
    text: z.string().min(1).describe('The text to speak.'),
    speaker: z
      .enum([
        'angus', 'asteria', 'arcas', 'orion', 'orpheus', 'athena',
        'luna', 'zeus', 'perseus', 'helios', 'hera', 'stella',
      ])
      .default('angus'),
    encoding: z.enum(['linear16', 'flac', 'mulaw', 'alaw', 'mp3', 'opus', 'aac']).default('mp3'),
    container: z.enum(['none', 'wav', 'ogg']).optional(),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: '@cf/deepgram/aura-1',
      runtime: 'workers-ai',
      input,
    });
    const ext = input.encoding === 'linear16' ? 'wav' : input.encoding;
    return {
      kind: 'audio',
      assets: await collectAssets(result, ctx, { mime: `audio/${ext}`, ext }),
      raw: result.json ?? null,
    };
  },
});
