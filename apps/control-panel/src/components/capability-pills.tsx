import type { ReactNode } from 'react';
import { ArrowGlyph, AudioGlyph, ImageGlyph, TextGlyph, VideoGlyph } from '@sequel/ui';

type Side = 'text' | 'image' | 'video' | 'audio';

const GLYPH: Record<Side, (props: { className?: string }) => ReactNode> = {
  text: TextGlyph,
  image: ImageGlyph,
  video: VideoGlyph,
  audio: AudioGlyph,
};

/**
 * Capabilities come off the model as flat strings. The ones shaped `x-to-y` are
 * transforms and read far faster as a glyph pair than as the words
 * "image-to-video"; everything else is a one-word modifier.
 *
 * Anything unmapped falls through as its own slug rather than disappearing — a
 * new capability should look unstyled, not be invisible.
 */
const TRANSFORM: Record<string, [Side, Side]> = {
  'text-to-image': ['text', 'image'],
  'image-to-image': ['image', 'image'],
  'text-to-video': ['text', 'video'],
  'image-to-video': ['image', 'video'],
  'text-to-speech': ['text', 'audio'],
  'text-to-music': ['text', 'audio'],
  'speech-to-text': ['audio', 'text'],
};

const WORD: Record<string, string> = {
  'image-editing': 'edit',
  inpainting: 'inpaint',
  'style-reference': 'style ref',
  'text-rendering': 'text in image',
  'transparent-background': 'transparency',
  upscale: 'upscale',
  'video-extend': 'extend',
  'synced-audio': 'audio',
  'voice-selection': 'voices',
  'voice-cloning': 'clone',
  'emotion-control': 'emotion',
  multilingual: 'multilingual',
  diarization: 'speakers',
  'word-timestamps': 'timestamps',
  lyrics: 'lyrics',
  instrumental: 'instrumental',
};

const pill =
  'inline-flex items-center rounded-md border border-[var(--color-line-strong)] text-[var(--color-muted)]';

export function CapabilityPills({ capabilities }: { capabilities: string[] }) {
  // Transforms first: they say what the model *is*, the words only qualify it.
  const transforms = capabilities.filter((c) => TRANSFORM[c]);
  const words = capabilities.filter((c) => !TRANSFORM[c]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {transforms.map((capability) => {
        const [from, to] = TRANSFORM[capability]!;
        const From = GLYPH[from];
        const To = GLYPH[to];
        return (
          <span key={capability} className={`${pill} gap-0.5 px-1.5 py-1`} title={capability}>
            <From />
            <ArrowGlyph className="text-[var(--color-dim)]" />
            <To />
          </span>
        );
      })}
      {words.map((capability) => (
        <span
          key={capability}
          className={`${pill} px-2 py-[3px] text-[11px]`}
          title={capability}
        >
          {WORD[capability] ?? capability}
        </span>
      ))}
    </div>
  );
}
