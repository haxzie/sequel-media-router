import type { ReactNode } from 'react';

/**
 * The surface the page's illustrations sit on.
 *
 * One of this page's own generations, pushed to grey so it reads as a
 * texture rather than as a second picture competing with whatever is laid on
 * top of it — a media company's own output is the only backdrop it should
 * need to buy. The gradient keeps the top and bottom edges from cutting
 * hard against the page.
 *
 * Shared rather than copied, because two plates that drift apart by a
 * brightness step look like a mistake rather than a system.
 */
export function Plate({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-[var(--color-line)] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/03.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover saturate-0 brightness-[3.8] contrast-[0.7]"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in oklab, var(--color-bg) 55%, transparent), transparent 42%, color-mix(in oklab, var(--color-bg) 70%, transparent))',
        }}
      />

      <div className="relative">{children}</div>
    </div>
  );
}
