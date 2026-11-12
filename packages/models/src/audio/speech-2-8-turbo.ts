import { createAudioModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/** MiniMax Speech 2.8 Turbo — voice cloning and emotion control across 40+ languages. */
export const minimaxSpeech = createAudioModel({
  id: 'minimax/speech-2.8-turbo',
  provider: 'minimax',
  name: 'MiniMax Speech 2.8 Turbo',
  description:
    'Natural, expressive speech with voice cloning, emotion control and 40+ language support, tuned for low latency.',
  capabilities: [
    'text-to-speech',
    'voice-selection',
    'voice-cloning',
    'emotion-control',
    'multilingual',
  ],
  tags: ['fast'],
  keywords: [
    'voice clone',
    'clone my voice',
    'emotional speech',
    'localisation',
    'translate voiceover',
    'narrator',
    'expressive',
  ],
  // developers.cloudflare.com/ai/models/minimax/speech-2.8-turbo (read 2026-11-10)
  rates: [{ unit: 'character', usd: '0.00006' }],
  runtime: 'ai-gateway',
  etaSeconds: 5,
  schemaUrl: partnerSchemaUrl('minimax', 'speech-2.8-turbo'),
  input: z.object({
    text: z.string().min(1).max(10_000),
    voice_id: z.string().default('English_expressive_narrator'),
    speed: z.number().min(0.5).max(2).default(1),
    volume: z.number().min(0.1).max(10).default(1),
    pitch: z.number().int().min(-12).max(12).default(0),
    emotion: z
      .enum(['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'calm', 'fluent'])
      .optional(),
    // Required upstream; defaulted here so callers need not supply it.
    format: z.enum(['mp3', 'flac', 'wav']).default('mp3'),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: 'minimax/speech-2.8-turbo',
      runtime: 'ai-gateway',
      input,
    });
    const ext = input.format;
    return {
      kind: 'audio',
      assets: await collectAssets(result, ctx, {
        mime: ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`,
        ext,
      }),
      raw: result.json ?? null,
    };
  },
});
