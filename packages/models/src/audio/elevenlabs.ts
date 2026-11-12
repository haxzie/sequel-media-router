import { elevenLabsModel } from './_elevenlabs';

/**
 * ElevenLabs on Cloudflare, read 2026-11-12. Four models, one contract.
 *
 * The split that matters: v3 and Multilingual v2 cost $0.0001/char, Flash and
 * Turbo cost half that. Flash is the latency play, Turbo balances the two.
 */

export const elevenV3 = elevenLabsModel({
  slug: 'eleven-v3',
  name: 'Eleven v3',
  description:
    'ElevenLabs’ most expressive speech model. Strongest emotional range and delivery, with prosody carried across chunk boundaries.',
  usdPerCharacter: '0.0001',
  capabilities: ['text-to-speech', 'voice-selection', 'emotion-control', 'multilingual'],
  tags: ['high-fidelity'],
  keywords: [
    'expressive voiceover',
    'character voice',
    'audiobook',
    'emotional delivery',
    'narration',
    'best quality speech',
    'elevenlabs',
  ],
  etaSeconds: 6,
});

export const elevenMultilingualV2 = elevenLabsModel({
  slug: 'eleven-multilingual-v2',
  name: 'Eleven Multilingual v2',
  description:
    'ElevenLabs’ long-standing multilingual workhorse. Consistent, natural delivery across 29 languages.',
  usdPerCharacter: '0.0001',
  capabilities: ['text-to-speech', 'voice-selection', 'multilingual'],
  tags: ['high-fidelity'],
  keywords: [
    'multilingual voiceover',
    'localisation',
    'dubbing',
    'translate speech',
    'consistent voice',
    'elevenlabs',
  ],
  etaSeconds: 6,
});

export const elevenFlashV25 = elevenLabsModel({
  slug: 'eleven-flash-v2-5',
  name: 'Eleven Flash v2.5',
  // Cloudflare will not bill this one through unified billing; it returns
  // "not available via unified billing, please use BYOK". Flagged so Forge
  // refuses before the round trip instead of after.
  requiresByok: true,
  description:
    'ElevenLabs’ low-latency model at half the price of v3. The one to reach for in a realtime loop or a voice agent.',
  usdPerCharacter: '0.00005',
  capabilities: ['text-to-speech', 'voice-selection', 'multilingual'],
  tags: ['fast', 'cheap'],
  keywords: [
    'realtime speech',
    'voice agent',
    'low latency',
    'interactive',
    'streaming voice',
    'cheap tts',
    'elevenlabs',
  ],
  etaSeconds: 2,
});

export const elevenTurboV25 = elevenLabsModel({
  slug: 'eleven-turbo-v2-5',
  name: 'Eleven Turbo v2.5',
  description:
    'ElevenLabs’ balance of quality and speed, priced with Flash. A sensible default when neither latency nor fidelity dominates.',
  usdPerCharacter: '0.00005',
  capabilities: ['text-to-speech', 'voice-selection', 'multilingual'],
  tags: ['fast', 'cheap'],
  keywords: [
    'balanced tts',
    'voiceover',
    'narration',
    'bulk speech',
    'cheap quality voice',
    'elevenlabs',
  ],
  etaSeconds: 3,
});
