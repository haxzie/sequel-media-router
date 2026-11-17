'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const USE_CASES = [
  {
    href: '/#models',
    art: '/landing/use-image.jpg',
    title: 'Image',
    body: 'Product shots, art direction, edits and background removal.',
  },
  {
    href: '/#models',
    art: '/landing/use-video.jpg',
    title: 'Video',
    body: 'Text and image to video, asynchronous, delivered by webhook.',
  },
  {
    href: '/#models',
    art: '/landing/use-audio.jpg',
    title: 'Audio',
    body: 'Speech, music and transcription, from one connection.',
  },
];

const LINKS = [
  { href: '/#models', label: 'Models' },
  { href: '/docs', label: 'Docs' },
  { href: '/pricing', label: 'Pricing' },
];

/**
 * Primary navigation, grouped with the wordmark.
 *
 * Use cases opens on hover and on click. Hover alone strands anyone on a
 * touch screen; click alone makes a pointer user commit to a menu before
 * they can see whether it is worth opening.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const esc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  // A small grace period, so crossing the gap between the label and the panel
  // does not shut it in your face.
  function hold() {
    if (close.current) clearTimeout(close.current);
    setOpen(true);
  }
  function release() {
    close.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <nav className="hidden items-center gap-6 text-[14px] text-[var(--color-muted)] md:flex">
      <div ref={box} className="relative" onMouseEnter={hold} onMouseLeave={release}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex items-center gap-1.5 transition-colors hover:text-[var(--color-text)]"
        >
          Use cases
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+14px)] z-40 w-[660px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2 shadow-2xl">
            <div className="grid grid-cols-3 gap-2">
              {USE_CASES.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.art}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* The text sits on the image, so it needs its own floor to
                      stay readable whatever the generation happened to be. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                  <div className="relative">
                    <div className="text-[14px] text-white">{item.title}</div>
                    <p className="mt-1 text-[12px] leading-snug text-white/65">{item.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="transition-colors hover:text-[var(--color-text)]">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
