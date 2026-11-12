import { createAudioModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/** The HD tier of MiniMax Speech: same controls as Turbo, higher fidelity, ~1.7x the price. */
export const minimaxSpeechHd = createAudioModel({
  id: 'minimax/speech-2.8-hd',
  provider: 'minimax',
  name: 'MiniMax Speech 2.8 HD',
  description:
    'MiniMax’s high-fidelity speech model. Voice cloning, emotion control and 40+ languages, tuned for quality rather than latency.',
  capabilities: [
    'text-to-speech',
    'voice-selection',
    'voice-cloning',
    'emotion-control',
    'multilingual',
  ],
  tags: ['high-fidelity'],
  keywords: [
    'high quality voiceover',
    'audiobook',
    'narration',
    'broadcast voice',
    'premium tts',
    'studio speech',
  ],
  // developers.cloudflare.com/ai/models/minimax/speech-2.8-hd (read 2026-11-12)
  rates: [{ unit: 'character', usd: '0.0001' }],
  runtime: 'ai-gateway',
  etaSeconds: 8,
  schemaUrl: partnerSchemaUrl('minimax', 'speech-2.8-hd'),
  input: z.object({
    text: z.string().min(1).max(10_000),
    voice_id: z.string().default('English_expressive_narrator'),
    speed: z.number().min(0.5).max(2).default(1),
    volume: z.number().min(0.1).max(10).default(1),
    pitch: z.number().int().min(-12).max(12).default(0),
    emotion: z
      .enum(['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'calm', 'fluent'])
      .optional(),
    format: z.enum(['mp3', 'flac', 'wav']).default('mp3'),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({
      model: 'minimax/speech-2.8-hd',
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
