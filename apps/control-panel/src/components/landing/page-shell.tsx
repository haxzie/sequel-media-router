import type { ReactNode } from 'react';
import { Arcs } from './mark';
import { Duo } from './parts';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/**
 * The frame every secondary page shares: arcs, header, a measured column,
 * footer.
 *
 * The company and legal pages are all the same shape — a title, a standfirst
 * and a column of prose — so the shape lives here rather than being copied
 * four times and drifting by a few pixels each time.
 */
export function PageShell({
  lead,
  tail,
  updated,
  children,
}: {
  lead: string;
  tail: string;
  /** Legal pages carry a date; company pages do not. */
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Arcs className="pointer-events-none absolute right-[-15vw] top-0 hidden h-[62vw] w-[62vw] text-[var(--color-text)] opacity-[0.07] lg:block" />

      <SiteHeader />

      <div className="relative mx-auto max-w-[1180px] px-6">
        <section className="pt-14 sm:pt-20">
          <Duo lead={lead} tail={tail} className="text-[clamp(1.8rem,3.6vw,2.6rem)]" />
          {updated && (
            <p className="mt-5 text-[13px] text-[var(--color-dim)]">Last updated {updated}</p>
          )}
        </section>

        <div className="doc article py-12">{children}</div>

        <SiteFooter />
      </div>
    </div>
  );
}

/** A section of prose, with the heading the page's contents can anchor to. */
export function Clause({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 id={id} className="text-[17px] tracking-tight text-[var(--color-text)]">
        {title}
      </h2>
      <div className="mt-2.5 space-y-3 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
        {children}
      </div>
    </section>
  );
}
