import { createAudioModel } from '@sequel/core';
import { z } from 'zod/v4';
import { workersAiSchemaUrl } from '../_shared';

/**
 * Deepgram Nova-3, speech-to-text.
 *
 * The one model here that consumes media rather than producing it, which is why
 * its output carries `transcript` and an asset list that may be empty.
 */
export const nova3 = createAudioModel({
  id: '@cf/deepgram/nova-3',
  provider: 'deepgram',
  name: 'Nova 3',
  description:
    'Deepgram’s speech-to-text model. Fast, accurate multilingual transcription with optional language detection, from an audio URL.',
  capabilities: ['speech-to-text', 'multilingual', 'word-timestamps', 'diarization'],
  tags: ['fast'],
  keywords: [
    'transcribe',
    'transcription',
    'subtitles',
    'captions',
    'speech to text',
    'meeting notes',
    'asr',
  ],
  // Billed per minute of audio; Cloudflare publishes the rate on the model page.
  rates: [{ unit: 'minute', usd: '0.0052' }],
  runtime: 'workers-ai',
  etaSeconds: 6,
  schemaUrl: workersAiSchemaUrl('nova-3'),
  input: z.object({
    audio_url: z
      .string()
      .url()
      .describe('Publicly fetchable audio. Use get_upload_url to obtain one.'),
    detect_language: z.boolean().default(true),
    diarize: z.boolean().default(false).describe('Label distinct speakers.'),
    punctuate: z.boolean().default(true),
  }),
  run: async (input, ctx) => {
    const { audio_url, ...options } = input;
    const result = await ctx.ai.run({
      model: '@cf/deepgram/nova-3',
      runtime: 'workers-ai',
      input: { audio: { url: audio_url }, ...options },
    });

    // Deepgram nests the transcript; fall back through the shapes it uses.
    const payload = (result.json?.result ?? result.json) as Record<string, unknown> | undefined;
    const channels = (payload?.results as { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> } | undefined)?.channels;
    const transcript =
      channels?.[0]?.alternatives?.[0]?.transcript ??
      (typeof payload?.text === 'string' ? payload.text : undefined);

    return {
      kind: 'audio',
      assets: transcript
        ? [{ url: audio_url, mime: 'text/plain', text: transcript }]
        : [],
      transcript,
      raw: result.json ?? null,
    };
  },
});
