'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AccountLink } from './account-link';
import { InstallPill } from './install-modal';
import { Wordmark } from './mark';
import { Nav } from './nav';

/**
 * The top bar: nothing at the top of the page, a floating frosted plate once
 * you leave it.
 *
 * It is transparent on arrival because the hero is the only thing that should
 * be on screen for that first moment, and a bar drawn over the arcs would cut
 * them. Past the fold it has to separate itself from whatever is scrolling
 * underneath, so it collects a blurred plate, a hairline and a shadow — and
 * pulls in from the full width, so it reads as floating rather than as a band
 * welded to the top of the window.
 *
 * The threshold is 8px rather than 0: at exactly 0 a trackpad's rubber-band
 * and a restored scroll position both flicker the plate on and off.
 */
export function SiteHeader() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <div
        className={`mx-auto flex items-center justify-between rounded-full transition-all duration-300 ${
          stuck
            ? 'max-w-[980px] border border-white/10 bg-[#0d0d0d]/70 px-5 py-2.5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl'
            : 'max-w-[1156px] border border-transparent px-2 py-2.5'
        }`}
      >
        {/* Wordmark and links as one group on the left, the way a product
            nav reads — the links belong to the brand, not to the gap. */}
        <div className="flex items-center gap-8">
          {/* The mark is the way back to the home page from every other one,
              which is the first thing a reader tries. */}
          <Link href="/" aria-label="Sequel home">
            <Wordmark />
          </Link>

          <Nav />
        </div>

        <div className="flex items-center gap-3">
          {/* Resolved in the browser so every page carrying this header can
              stay static; see account-link.tsx. */}
          <AccountLink className="text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]" />
          <InstallPill variant="compact">Get started</InstallPill>
        </div>
      </div>
    </header>
  );
}
