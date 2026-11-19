import Link from 'next/link';
import type { ReactNode } from 'react';
import { KeyLink } from '@/components/landing/account-link';
import { Arcs, Wordmark } from '@/components/landing/mark';
import { Nav } from '@/components/landing/nav';
import type { DocHeading } from '@/lib/docs-headings';
import { DocIcon } from './icons';
import { DOC_PAGES, DOC_SECTIONS, href } from './nav';
import { Toc } from './toc';

/**
 * Docs chrome: three rails — the tree, the page, and what is on the page.
 *
 * The whole tree is always visible rather than collapsed by section: the
 * set is small enough to read at a glance, and a reader who cannot see
 * Tasks exists will not go looking for it.
 *
 * The bar runs the full width of the window while the columns stay in a
 * measure, so the chrome reads as the app and the prose still reads as
 * prose. The right rail only appears at xl, where there is room for it
 * without squeezing the code blocks.
 *
 * The bar also sticks. Docs pages are long and the way out of one — back to
 * the site, or on to a key — should not require scrolling to the top to
 * find it.
 */
export function DocsShell({
  slug,
  headings,
  children,
}: {
  slug: string;
  headings: DocHeading[];
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-x-clip">
      {/* Fainter than the home page's. Docs are read rather than looked at,
          and a texture behind a code block is a distraction with a brand
          justification. */}
      <Arcs className="pointer-events-none absolute -top-[180px] right-[-180px] hidden h-[720px] w-[720px] text-[var(--color-text)] opacity-[0.04] xl:block" />

      {/* Opaque enough to read over, blurred rather than solid so the page
          scrolling under it stays visible as motion. */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-bg)_82%,transparent)] px-6 py-4 backdrop-blur-xl">
        {/* The site's own nav, not a docs-only bar. A reader who lands here
            from a search result is one click from the rest of the site, and
            'Back to site' was doing that job for one of the five places they
            might actually want. */}
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Sequel home">
            <Wordmark />
          </Link>

          <Nav />
        </div>

        <div className="flex items-center gap-4">
          {/* A key is the thing a reader of these pages is here to get, so
              the bar says that rather than 'sign in'. Client-side, so these
              pages stay static; see account-link.tsx. */}
          <KeyLink className="chip h-8 px-3.5 text-[13px] font-medium" />
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1460px] gap-12 px-6 py-10">
        <aside className="sticky top-[88px] hidden h-fit w-[200px] shrink-0 md:block">
          {DOC_SECTIONS.map((section) => (
            <div key={section.title} className="mb-7">
              <div className="mb-2.5 text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.pages.map((page) => {
                  const active = page.slug === slug;
                  return (
                    <li key={page.slug}>
                      <Link
                        href={href(page.slug)}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] transition-colors ${
                          active
                            ? 'bg-[var(--color-card)] text-[var(--color-text)]'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {/* Dimmer than the label unless the page is open:
                            eleven glyphs at label weight is a wall of marks
                            with words next to it. */}
                        <DocIcon
                          name={page.icon}
                          className={active ? '' : 'text-[var(--color-dim)]'}
                        />
                        {page.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        <main className="doc min-w-0 flex-1 pb-24">
          {children}
          <Pager slug={slug} />
        </main>

        <Toc headings={headings} />
      </div>
    </div>
  );
}

/**
 * Where to go when the page runs out.
 *
 * The docs are written in an order, and the end of a page is exactly where
 * a reader decides whether to keep going. Leaving them to find the sidebar
 * again is how a sequence turns into a pile.
 */
function Pager({ slug }: { slug: string }) {
  const index = DOC_PAGES.findIndex((page) => page.slug === slug);
  const previous = index > 0 ? DOC_PAGES[index - 1] : undefined;
  const next = index >= 0 ? DOC_PAGES[index + 1] : undefined;

  if (!previous && !next) return null;

  return (
    <nav className="mt-16 grid gap-3 border-t border-[var(--color-line)] pt-8 sm:grid-cols-2">
      {previous ? <PagerCard page={previous} direction="previous" /> : <span />}
      {next && <PagerCard page={next} direction="next" />}
    </nav>
  );
}

function PagerCard({
  page,
  direction,
}: {
  page: (typeof DOC_PAGES)[number];
  direction: 'previous' | 'next';
}) {
  const forward = direction === 'next';

  return (
    <Link
      href={href(page.slug)}
      className={`group no-underline flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-line-strong)] ${
        forward ? 'sm:flex-row-reverse sm:text-right' : ''
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-card)] text-[var(--color-muted)]">
        <DocIcon name={page.icon} />
      </span>

      <span className="min-w-0">
        <span className="block text-[11.5px] uppercase tracking-wide text-[var(--color-dim)]">
          {forward ? 'Next' : 'Previous'}
        </span>
        <span className="mt-0.5 block truncate text-[14.5px] text-[var(--color-text)]">
          {page.title}
        </span>
      </span>
    </Link>
  );
}
