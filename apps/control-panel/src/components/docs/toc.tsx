'use client';

import { useEffect, useState } from 'react';
import type { DocHeading } from '@/lib/docs-headings';
import { MarkRow } from './parts';

/**
 * On-page contents, read from the page rather than declared beside it.
 *
 * Every docs page is hand-written JSX, so a table of contents kept in
 * `nav.ts` would be a second list to update and the first one to rot. This
 * reads the rendered `h2[id]`s instead: a heading that exists is in here,
 * and one that is renamed renames itself.
 *
 * The active item is the last heading above the reading line, measured on
 * scroll. An IntersectionObserver was the first attempt and was wrong: it
 * only reports headings that *cross* its band, so jumping to an anchor — or
 * landing between two headings — left the mark on whatever last crossed.
 * Measuring positions answers 'where am I' directly, and rAF keeps it to
 * one read per frame.
 */

interface Heading {
  id: string;
  text: string;
}

/* The clients a reader is most likely to already have open. Same marks the
   install list uses, so this costs no new assets. */
const AGENTS = [
  { id: 'claude', logo: '/clients/claude.svg', tone: '#D97757' },
  { id: 'chatgpt', logo: '/clients/chatgpt.svg', tone: '#10A37F' },
  { id: 'cursor', logo: '/clients/cursor.svg', tone: '#111111' },
  { id: 'gemini', logo: '/clients/gemini.svg', tone: '#4285F4' },
];

export function Toc({ headings }: { headings: DocHeading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;

    const nodes = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      let current = nodes[0]!.id;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= 120) current = node.id;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = nodes[nodes.length - 1]!.id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [headings]);

  return (
    <aside className="sticky top-[88px] hidden h-fit w-[232px] shrink-0 xl:block">
      {headings.length > 0 && (
        <>
          <div className="mb-2.5 text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
            On this page
          </div>
          <ul className="mb-8 space-y-0.5 border-l border-[var(--color-line)]">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={`-ml-px block border-l py-1.5 pl-3 text-[13px] transition-colors ${
                    active === heading.id
                      ? 'border-[var(--color-text)] text-[var(--color-text)]'
                      : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* The one piece of marketing in the docs, at the bottom of the rail
          where it is read by someone who got far enough to want it. */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
        <MarkRow marks={AGENTS} />

        <div className="mt-3.5 text-[14px] text-[var(--color-text)]">
          Add Sequel to your agent
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
          One command, no API key. Your agent searches 100+ models and generates while you read
          this.
        </p>

        <a href="/docs/creators" className="chip mt-4 h-8 w-full justify-center text-[13px]">
          Get started
          <svg viewBox="0 0 16 16" fill="none" className="ml-1.5 h-3.5 w-3.5" aria-hidden>
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </aside>
  );
}
