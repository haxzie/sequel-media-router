import { createAudioModel, type Capability, type Rate, type Tag } from '@forge/core';
import { z } from 'zod/v4';
import { collectAssets, partnerSchemaUrl } from '../_shared';

/**
 * All four ElevenLabs models on Cloudflare share one input contract, so they
 * share one definition. Only the id, the blurb, the rate and the tags differ.
 *
 * `voice_id` is required upstream with no default. Defaulted here to the voice
 * Cloudflare's own example uses, so a caller who has not yet picked one still
 * gets audio rather than a validation error.
 */
const DEFAULT_VOICE = 'JBFqnCBsd6RMkjVDRZzb';

const OUTPUT_FORMATS = [
  'mp3_22050_32',
  'mp3_24000_48',
  'mp3_44100_32',
  'mp3_44100_64',
  'mp3_44100_96',
  'mp3_44100_128',
  'mp3_44100_192',
  'opus_48000_32',
  'opus_48000_64',
  'opus_48000_96',
  'opus_48000_128',
  'opus_48000_192',
] as const;

const input = z.object({
  text: z.string().min(1).describe('The text to speak.'),
  voice_id: z
    .string()
    .default(DEFAULT_VOICE)
    .describe('An ElevenLabs voice ID. Defaults to a general-purpose narrator.'),
  output_format: z.enum(OUTPUT_FORMATS).default('mp3_44100_128'),
  language_code: z.string().optional().describe('ISO 639-1 code to enforce a language.'),
  voice_settings: z
    .object({
      stability: z.number().min(0).max(1).optional(),
      similarity_boost: z.number().min(0).max(1).optional(),
      style: z.number().min(0).max(1).optional(),
      use_speaker_boost: z.boolean().optional(),
      speed: z.number().optional(),
    })
    .optional(),
  /** Surrounding text improves prosody at a chunk boundary without being spoken. */
  previous_text: z.string().optional(),
  next_text: z.string().optional(),
  apply_text_normalization: z.enum(['auto', 'on', 'off']).default('auto'),
  seed: z.number().int().optional(),
});

export function elevenLabsModel(spec: {
  slug: string;
  name: string;
  description: string;
  usdPerCharacter: string;
  capabilities: Capability[];
  tags: Tag[];
  keywords: string[];
  etaSeconds: number;
  requiresByok?: boolean;
}) {
  const rates: Rate[] = [{ unit: 'character', usd: spec.usdPerCharacter }];

  return createAudioModel({
    id: `elevenlabs/${spec.slug}`,
    provider: 'elevenlabs',
    name: spec.name,
    description: spec.description,
    capabilities: spec.capabilities,
    tags: spec.tags,
    keywords: spec.keywords,
    rates,
    runtime: 'ai-gateway',
    etaSeconds: spec.etaSeconds,
    schemaUrl: partnerSchemaUrl('elevenlabs', spec.slug),
    requiresByok: spec.requiresByok,
    input,
    run: async (parsed, ctx) => {
      const result = await ctx.ai.run({
        model: `elevenlabs/${spec.slug}`,
        runtime: 'ai-gateway',
        input: parsed,
      });
      const opus = parsed.output_format.startsWith('opus');
      return {
        kind: 'audio',
        assets: await collectAssets(result, ctx, {
          mime: opus ? 'audio/opus' : 'audio/mpeg',
          ext: opus ? 'opus' : 'mp3',
        }),
        raw: result.json ?? null,
      };
    },
  });
}
