'use client';

import { useMemo, useState } from 'react';
import { highlight } from 'sugar-high';
import { lang as resolveLang } from 'sugar-high/lang';
import type { ReactNode } from 'react';

/*
 * sugar-high is ~8KB with no dependencies and emits spans coloured through
 * `var(--sh-*)`, so the whole theme is nine custom properties in globals.css
 * rather than a stylesheet per language. Shiki would be better at this and
 * about fifty times the size for a handful of code blocks.
 *
 * It ships a grammar per language — shell included, which is why `bash` is
 * highlighted rather than left plain: flags land as properties, quoted
 * arguments as strings. `resolveLang` maps our fence names onto its
 * canonical ones (bash → shell, ts → typescript) and returns undefined for
 * anything it has no grammar for, which falls back to JavaScript.
 */

/**
 * The copy mark, drawn to the same spec as the button it came from: a 16
 * viewBox, currentColor stroke at 1.5, round caps and joins. It swaps for a
 * check on success, so the confirmation is visible without reading the word.
 */
function CopyMark({ copied }: { copied: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[13px] w-[13px] shrink-0"
      aria-hidden
    >
      {copied ? (
        <path d="M3.5 8.5l3 3 6-6.5" />
      ) : (
        <>
          <rect x="5.75" y="5.75" width="7.5" height="7.5" rx="2" />
          <path d="M10.25 3.25a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2" />
        </>
      )}
    </svg>
  );
}

export function Code({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  /* Deterministic, so the server and the client produce the same markup and
     this hydrates clean. The input is our own source, never a reader's. */
  const html = useMemo(
    () => highlight(children, { lang: resolveLang(lang ?? 'ts') }),
    [children, lang],
  );

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
          className="chip h-[26px] gap-1.5 px-2.5 text-[11.5px]"
        >
          <CopyMark copied={copied} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className="scroll-area overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.75] text-[var(--color-muted)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
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
          className="chip h-[26px] gap-1.5 px-3 text-[11.5px] font-medium"
        >
          <CopyMark copied={copied} />
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

/**
 * The two big doors at the top of Getting started.
 *
 * Deliberately larger than `Card`: this is the only decision the page asks a
 * reader to make, and the rest of the docs are one width down from it.
 */
export interface Mark {
  id: string;
  logo: string;
  /** Tile colour. The glyph is masked white on top of it. */
  tone: string;
}

/**
 * The marks that belong to a door, overlapped the way a shared-with row is.
 *
 * Same construction as the landing page's install button: a brand-coloured
 * tile with the glyph masked white over it, so one single-colour SVG serves
 * every size and background. Left-aligned and overlapping, because the point
 * is 'these, together', not a list.
 */
export function MarkRow({ marks }: { marks: Mark[] }) {
  return (
    <span className="flex items-center -space-x-2" aria-hidden>
      {marks.map((mark) => (
        <span
          key={mark.id}
          /* relative, so each tile paints as a unit. Without it the browser
             draws every background first and every glyph after, which put
             one tile's logo on top of the next tile's fill. */
          className="relative flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-[var(--color-surface)]"
          style={{ background: mark.tone }}
        >
          <span
            className="h-4 w-4 bg-white"
            style={{
              maskImage: `url(${mark.logo})`,
              WebkitMaskImage: `url(${mark.logo})`,
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

export function Paths({ children }: { children: ReactNode }) {
  return <div className="my-8 grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function PathCard({
  label,
  title,
  body,
  points,
  marks,
  href,
  cta,
}: {
  label: string;
  title: string;
  body: string;
  points: string[];
  marks?: Mark[];
  href: string;
  cta: string;
}) {
  return (
    <a
      href={href}
      className="no-underline group flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-line-strong)] sm:p-7"
    >
      <span className="flex items-center justify-between gap-4">
        <span className="text-[11.5px] uppercase tracking-wide text-[var(--color-dim)]">
          {label}
        </span>
      </span>

      {marks && (
        <span className="mt-4 block">
          <MarkRow marks={marks} />
        </span>
      )}

      <span className="mt-4 text-[20px] tracking-tight text-[var(--color-text)]">{title}</span>
      <span className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-muted)]">{body}</span>

      <span className="mt-5 flex flex-col gap-1.5">
        {points.map((point) => (
          <span key={point} className="flex items-start gap-2.5 text-[13.5px] text-[var(--color-muted)]">
            <span
              className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--color-line-strong)]"
              aria-hidden
            />
            {point}
          </span>
        ))}
      </span>

      <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] text-[var(--color-text)]">
        {cta}
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden>
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
