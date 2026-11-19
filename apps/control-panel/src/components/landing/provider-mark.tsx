/**
 * A model's provider, as its mark.
 *
 * The files are vendored under public/providers, so the page makes no
 * third-party request at render time, and they are rendered through <img>,
 * which disables scripting inside an SVG. Monochrome marks sit on a white
 * tile the way the catalogue shows them — which is also what keeps them
 * legible on a dark page.
 *
 * A provider with no usable mark falls through to a tinted monogram rather
 * than borrowing a wrong logo. Nothing in the catalogue needs that today.
 */

const LOGO: Record<string, string> = {
  google: '/providers/google.svg',
  openai: '/providers/openai.svg',
  alibaba: '/providers/alibaba.svg',
  elevenlabs: '/providers/elevenlabs.svg',
  deepgram: '/providers/deepgram.svg',
  minimax: '/providers/minimax.svg',
  'black-forest-labs': '/providers/black-forest-labs.svg',
  xai: '/providers/xai.png',
  leonardo: '/providers/leonardo.png',
};

/*
 * Leonardo publishes its mark light-on-black, which is invisible on the white
 * tile every other provider sits on. The file is greyscale, so inverting it
 * turns the glyph dark and the plate white — and the plate then disappears
 * into the tile instead of being a black square.
 */
const INVERTED = new Set(['leonardo']);

const TONE: Record<string, string> = {
  google: 'var(--color-sky)',
  openai: 'var(--color-mint)',
  minimax: 'var(--color-pink)',
  elevenlabs: 'var(--color-periwinkle)',
  xai: 'var(--color-sand)',
  alibaba: 'var(--color-sky)',
  bytedance: 'var(--color-periwinkle)',
  'black-forest-labs': 'var(--color-sand)',
  deepgram: 'var(--color-mint)',
  leonardo: 'var(--color-pink)',
};

export function ProviderMark({
  provider,
  name,
  className = 'h-7 w-7 rounded-lg',
}: {
  provider: string;
  /** Only used for the monogram, when there is no mark to show. */
  name: string;
  className?: string;
}) {
  const logo = LOGO[provider];

  if (logo) {
    return (
      <span className={`flex shrink-0 items-center justify-center bg-white ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          className={`h-[55%] w-[55%] object-contain ${INVERTED.has(provider) ? 'invert' : ''}`}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center text-[11px] font-semibold uppercase text-[#0a0a0a] ${className}`}
      style={{ background: TONE[provider] ?? 'var(--color-muted)' }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}
