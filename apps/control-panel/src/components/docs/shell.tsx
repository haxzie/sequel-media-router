import Link from 'next/link';
import type { ReactNode } from 'react';
import { Arcs, Wordmark } from '@/components/landing/mark';
import { DOC_SECTIONS, href } from './nav';

/**
 * Docs chrome: a sidebar of every page and the content beside it.
 *
 * The whole tree is always visible rather than collapsed by section — the
 * set is small enough to read at a glance, and a reader who cannot see
 * Tasks exists will not go looking for it.
 */
export function DocsShell({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <div className="relative mx-auto max-w-[1180px] px-6">
      {/* Fainter than the home page's. Docs are read rather than looked at,
          and a texture behind a code block is a distraction with a brand
          justification. */}
      <Arcs className="pointer-events-none absolute -top-[180px] right-[-280px] hidden h-[720px] w-[720px] text-[var(--color-text)] opacity-[0.04] xl:block" />

      <header className="flex items-center justify-between border-b border-[var(--color-line)] py-5">
        <div className="flex items-center gap-8">
          <Link href="/">
            <Wordmark />
          </Link>
          <span className="text-[14px] text-[var(--color-muted)]">Docs</span>
        </div>
        <Link
          href="/"
          className="text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          Back to site
        </Link>
      </header>

      <div className="flex gap-12 py-10">
        <aside className="sticky top-8 hidden h-fit w-[200px] shrink-0 md:block">
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
                        className={`block rounded-lg px-2.5 py-1.5 text-[13.5px] transition-colors ${
                          active
                            ? 'bg-[var(--color-card)] text-[var(--color-text)]'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {page.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        <main className="doc min-w-0 flex-1 pb-24">{children}</main>
      </div>
    </div>
  );
}
