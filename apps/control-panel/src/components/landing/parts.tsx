import type { ReactNode } from 'react';

/**
 * Polar's signature: two lines at one size, one white and one grey, reading
 * as a single sentence in two tones. It does the work a headline and a
 * subhead normally split between them, without the size drop that makes the
 * second line look like a caption.
 */
export function Duo({
  lead,
  tail,
  className = '',
}: {
  lead: string;
  tail: string;
  className?: string;
}) {
  return (
    <h2 className={`font-medium leading-[1.12] tracking-[-0.02em] ${className}`}>
      <span className="block text-[var(--color-text)]">{lead}</span>
      <span className="block text-[var(--color-dim)]">{tail}</span>
    </h2>
  );
}

/** Numbered section marker, as 01 Meter anything. */
export function Marker({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-2.5 text-[13px]">
      <span className="text-[var(--color-dim)]">{n}</span>
      <span className="text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

export function Pill({
  href,
  children,
  tone = 'solid',
}: {
  href: string;
  children: ReactNode;
  tone?: 'solid' | 'ghost';
}) {
  const solid = 'bg-white text-[#0a0a0a] hover:opacity-90';
  const ghost =
    'border border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-text)]';

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium transition-all ${
        tone === 'solid' ? solid : ghost
      }`}
    >
      {children}
      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

export function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-[var(--color-line)] py-20 ${className}`}>
      {children}
    </section>
  );
}
