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
    <h2 className={`font-normal leading-[1.14] tracking-[-0.02em] ${className}`}>
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

/**
 * Clients shown on the button itself.
 *
 * The three worth naming, overlapped the way a shared-with row is, because
 * 'add to your agent' means nothing until you see that yours is one of them.
 */
const FACES = [
  { id: 'claude-code', logo: '/clients/claude-code.svg', tone: '#D97757' },
  { id: 'codex', logo: '/clients/codex.svg', tone: '#1f1f1f' },
  { id: 'claude', logo: '/clients/claude.svg', tone: '#D97757' },
];

export function Faces() {
  return (
    <span className="flex items-center -space-x-1.5" aria-hidden>
      {FACES.map((face) => (
        <span
          key={face.id}
          className="flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white"
          style={{ background: face.tone }}
        >
          <span
            className="h-2.5 w-2.5 bg-white"
            style={{
              maskImage: `url(${face.logo})`,
              WebkitMaskImage: `url(${face.logo})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />
        </span>
      ))}
    </span>
  );
}

export function Pill({
  href,
  children,
  tone = 'solid',
  faces,
}: {
  href: string;
  children: ReactNode;
  tone?: 'solid' | 'ghost';
  /** Show the client marks ahead of the label. */
  faces?: boolean;
}) {
  const solid = 'bg-white text-[#0a0a0a] hover:opacity-90';
  const ghost =
    'border border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-text)]';

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2.5 rounded-full text-[14px] font-medium transition-all ${
        faces ? 'py-2 pl-2 pr-4' : 'px-5 py-2.5'
      } ${tone === 'solid' ? solid : ghost}`}
    >
      {faces && <Faces />}
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
