import { createAudioModel } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/**
 * xAI Grok TTS.
 *
 * Priced identically to Aura ($0.000015/char either way, once Aura's per-1k rate
 * is normalised). The reason to pick one over the other is capability, not cost:
 * Grok brings inline emotion tags and 20+ languages, Aura brings named voices.
 */
export const grokTts = createAudioModel({
  id: 'xai/grok-tts',
  provider: 'xai',
  name: 'Grok TTS',
  description:
    'xAI’s text-to-speech. Five expressive voices across 20+ languages, with inline tags for laughter, whispers and pauses.',
  capabilities: ['text-to-speech', 'voice-selection', 'emotion-control', 'multilingual'],
  tags: ['cheap', 'fast'],
  keywords: [
    'expressive speech',
    'character voice',
    'multilingual voiceover',
    'laugh',
    'whisper',
    'emotion',
    'dubbing',
  ],
  // developers.cloudflare.com/ai/models/xai/grok-tts (read 2026-11-10)
  rates: [{ unit: 'character', usd: '0.000015' }],
  runtime: 'ai-gateway',
  etaSeconds: 4,
  schemaUrl: partnerSchemaUrl('xai', 'grok-tts'),
  input: z.object({
    text: z
      .string()
      .min(1)
      .max(15_000)
      .describe('Supports inline tags: [pause], [laugh], <whisper>…</whisper>.'),
    voice: z.enum(['eve', 'ara', 'rex', 'sal', 'leo']).default('eve'),
    language: z.string().default('auto').describe('BCP-47 code, or "auto" to detect.'),
  }),
  run: async (input, ctx) => {
    const result = await ctx.ai.run({ model: 'xai/grok-tts', runtime: 'ai-gateway', input });
    return {
      kind: 'audio',
      assets: await collectAssets(result, ctx, { mime: 'audio/mpeg', ext: 'mp3' }),
    };
  },
});
