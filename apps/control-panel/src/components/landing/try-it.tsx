'use client';

import { useEffect, useState } from 'react';
import { Mark } from './mark';

/**
 * The composer, playing by itself, on a plate of the page's own output.
 *
 * Polar's pattern: a wide textured plate under the section copy with one
 * small dark card sitting on it, showing a single call and what it cost. The
 * card here is a chat input, because that is the shape of the surface an
 * agent drives — but nothing in it is wired. A job types itself out, the
 * catalogue picks a model in the corner where a model picker would sit, and
 * the next job starts. There is no field to focus and nothing to click,
 * which is the point: this page never spends money.
 *
 * Every model and figure is the catalogue's own. FLUX at 1024² and four
 * steps is four 512 tiles plus four steps, which is what `estimateCost`
 * returns for that input; Lucid at its 1120² default is nine tiles; Hailuo
 * and Music are published per-clip and per-track rates.
 */

interface Case {
  prompt: string;
  model: string;
  /** Drives the dot colour, matching the usage chart's modality series. */
  modality: 'image' | 'video' | 'audio';
  cost: string;
  basis: string;
}

const CASES: Case[] = [
  {
    prompt: 'An amber glass vase lit from above, black backdrop',
    model: 'FLUX.1 [schnell]',
    modality: 'image',
    cost: '$0.000634',
    basis: 'cheapest image model',
  },
  {
    prompt: 'A poster that reads SEQUEL in heavy type',
    model: 'Lucid Origin',
    modality: 'image',
    cost: '$0.063492',
    basis: 'renders legible text',
  },
  {
    prompt: 'Six seconds of a desk lamp flickering on, slow push in',
    model: 'Hailuo 2.3',
    modality: 'video',
    cost: '$0.28',
    basis: 'video under $0.30',
  },
  {
    prompt: 'A warm lo-fi loop for a product walkthrough',
    model: 'MiniMax Music 2.6',
    modality: 'audio',
    cost: '$0.15',
    basis: 'instrumental track',
  },
];

const DOT = {
  image: 'var(--chart-image)',
  video: 'var(--chart-video)',
  audio: 'var(--chart-audio)',
} as const;

type Phase = 'typing' | 'searching' | 'picked' | 'erasing';

/** Milliseconds: per character typed, per character erased, search, hold. */
const PACE = { type: 38, erase: 14, search: 750, hold: 2800 };

export function TryIt() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  /* Until this flips, the card renders its resting state — the first job
     fully typed with its model chosen. That is also what a reader who has
     asked for reduced motion keeps, and what the HTML ships as. */
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setTyped('');
    setPlaying(true);
  }, []);

  const current = CASES[index]!;

  useEffect(() => {
    if (!playing) return;

    let delay = 0;
    let next: () => void;

    switch (phase) {
      case 'typing':
        if (typed.length < current.prompt.length) {
          delay = PACE.type;
          next = () => setTyped(current.prompt.slice(0, typed.length + 1));
        } else {
          delay = PACE.search;
          next = () => setPhase('searching');
        }
        break;
      case 'searching':
        delay = PACE.search;
        next = () => setPhase('picked');
        break;
      case 'picked':
        delay = PACE.hold;
        next = () => setPhase('erasing');
        break;
      case 'erasing':
        if (typed.length > 0) {
          delay = PACE.erase;
          next = () => setTyped(typed.slice(0, -1));
        } else {
          delay = 260;
          next = () => {
            setIndex((n) => (n + 1) % CASES.length);
            setPhase('typing');
          };
        }
        break;
    }

    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  }, [playing, phase, typed, current.prompt]);

  const resting = !playing;
  const text = resting ? current.prompt : typed;
  const decided = resting || phase === 'picked' || phase === 'erasing';

  return (
    <div className="relative mt-14 overflow-hidden rounded-3xl border border-[var(--color-line)]">
      {/* The plate. One of this page's own generations, pushed to grey so it
          is a surface rather than a second picture competing with the card. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/03.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-90 saturate-0 brightness-[2.4] contrast-[0.8]"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in oklab, var(--color-bg) 70%, transparent), transparent 42%, color-mix(in oklab, var(--color-bg) 85%, transparent))',
        }}
      />

      <div className="relative px-4 py-14 sm:px-8 sm:py-20">
        {/* Decorative: a screen reader gets the sentence below instead of a
            prompt that rewrites itself four times a minute. */}
        <p className="sr-only">
          A composer types a job — {CASES[0]!.prompt} — and Sequel picks {CASES[0]!.model} for it,
          at {CASES[0]!.cost} a run.
        </p>

        <div
          aria-hidden
          className="mx-auto w-full max-w-[600px] rounded-2xl border border-white/10 bg-[#0d0d0d]/90 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.95)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <span className="flex items-center gap-2 text-[13px] text-[var(--color-text)]">
              <Mark className="h-[15px] w-[15px]" />
              Sequel
            </span>
            <span className="text-[12px] text-[var(--color-dim)]">over MCP</span>
          </div>

          <div className="p-4">
            {/* Two lines of room, always, so the card does not change height
                as the job types itself in and out. */}
            <p className="min-h-[48px] text-[15px] leading-relaxed text-[var(--color-text)]">
              {text}
              {!resting && (
                <span className="ml-0.5 inline-block h-[15px] w-[2px] translate-y-[2px] animate-pulse bg-[var(--color-text)]" />
              )}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              {/* Where a model picker sits in a chat composer — except the
                  catalogue fills it in, which is the whole product. */}
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 py-1.5 pl-2.5 pr-3">
                {decided ? (
                  <>
                    <span
                      className="h-[6px] w-[6px] shrink-0 rounded-full"
                      style={{ background: DOT[current.modality] }}
                    />
                    <span className="truncate text-[12.5px] text-[var(--color-text)]">
                      {current.model}
                    </span>
                    <span className="nums shrink-0 font-mono text-[11.5px] text-[var(--color-dim)]">
                      {current.cost}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="spin-slow h-[9px] w-[9px] shrink-0 rounded-full border border-[var(--color-dim)] border-t-transparent" />
                    <span className="truncate text-[12.5px] text-[var(--color-muted)]">
                      {phase === 'searching' ? 'search_models' : 'Reading the job…'}
                    </span>
                  </>
                )}
              </div>

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0a0a0a]">
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                  <path
                    d="M8 13V3m0 0L4 7m4-4 4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <p
          aria-hidden
          className="mx-auto mt-5 max-w-[600px] text-center text-[12.5px] text-[var(--color-dim)]"
        >
          {decided ? `Picked because it is the ${current.basis}.` : 'Searching the catalogue…'}
        </p>
      </div>
    </div>
  );
}
