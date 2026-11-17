'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

export function Code({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative my-5 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
          {lang ?? 'ts'}
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-[11.5px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-text)]"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="scroll-area overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.75] text-[var(--color-muted)]">
        {children}
      </pre>
    </div>
  );
}

/**
 * A prompt to hand an agent so it can write Sequel code without guessing.
 *
 * Shipped as a copyable block rather than prose because its only use is to
 * be pasted somewhere else, and a reader who has to reformat it will write
 * their own worse one instead.
 */
export function SystemPrompt({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[var(--color-line-strong)]">
      <div className="flex items-center justify-between bg-[var(--color-card)] px-4 py-2.5">
        <span className="text-[12px] text-[var(--color-muted)]">
          System prompt — paste into your agent
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="scroll-area max-h-[320px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[12px] leading-[1.7] text-[var(--color-muted)]">
        {children}
      </pre>
    </div>
  );
}

export function Cards({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>;
}

export function Card({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl border border-[var(--color-line)] p-5 transition-colors hover:border-[var(--color-line-strong)]"
    >
      <div className="text-[15px] text-[var(--color-text)]">{title}</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text)]">
        {cta}
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

export function Table({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[var(--color-line)]">
      {rows.map(([a, b, c], index) => (
        <div
          key={a + b}
          className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-4 px-4 py-2.5 text-[13px] ${
            index === 0
              ? 'bg-[var(--color-card)] text-[var(--color-dim)]'
              : 'border-t border-[var(--color-line)]'
          }`}
        >
          <span className={index === 0 ? '' : 'font-mono text-[12px] text-[var(--color-text)]'}>{a}</span>
          <span className={index === 0 ? '' : 'font-mono text-[12px] text-[var(--color-muted)]'}>{b}</span>
          <span className="text-[var(--color-muted)]">{c}</span>
        </div>
      ))}
    </div>
  );
}
