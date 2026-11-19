'use client';

import { useEffect, useState } from 'react';
import type { Heading } from '@/lib/blog';

/**
 * Contents for an article, on the right.
 *
 * The headings are passed in rather than scraped: the markdown renderer
 * already walked them to assign ids, and a second derivation in the browser
 * is a second chance for the two to disagree.
 *
 * The active item is the last heading above the reading line, measured on
 * scroll. An IntersectionObserver only fires on crossings, which leaves the
 * mark stale after an anchor jump — the docs rail learned that the hard way.
 */
export function ArticleToc({ headings }: { headings: Heading[] }) {
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

  if (headings.length === 0) return null;

  return (
    <aside className="sticky top-[88px] hidden h-fit w-[230px] shrink-0 lg:block">
      <div className="mb-2.5 text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
        On this page
      </div>
      <ul className="space-y-0.5 border-l border-[var(--color-line)]">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`-ml-px block border-l py-1.5 text-[13px] transition-colors ${
                heading.level === 3 ? 'pl-6' : 'pl-3'
              } ${
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
    </aside>
  );
}
