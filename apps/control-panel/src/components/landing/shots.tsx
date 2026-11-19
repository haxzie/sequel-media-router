import { highlight } from 'sugar-high';
import type { ReactNode } from 'react';

/**
 * Synthetic product shots for the feature grid.
 *
 * These are not screenshots and not images: they are the real interface
 * primitives — the same rows, pills and mono figures the dashboard uses —
 * rebuilt at a smaller scale so they stay sharp on any display, weigh
 * nothing, and cannot go stale the way a captured PNG does.
 *
 * Each one is cropped rather than fitted. The frame bleeds past the right
 * and bottom edges of its card so the interface reads as something larger
 * that the card happens to be showing part of, and everything around the
 * one row worth reading is blurred down — the way the eye actually lands
 * on a screen, rather than a flat panel competing with the copy above it.
 */

/**
 * The crop: a frame that runs off the card, faded where it leaves.
 *
 * `frame` sizes it past the card on purpose — a width over 100% cuts the
 * right edge, a fixed height cuts the bottom. Nothing inside scrolls: the
 * point is that there is more of it than the card is showing.
 */
function Shot({
  children,
  frame = 'w-[124%]',
  padded = true,
}: {
  children: ReactNode;
  frame?: string;
  padded?: boolean;
}) {
  return (
    <div className="relative -mb-6 -mr-6 overflow-hidden sm:-mb-7 sm:-mr-7">
      <div
        className={`overflow-hidden rounded-tl-[14px] border-l border-t border-[var(--color-line)] bg-[var(--color-bg)] ${padded ? 'p-3' : ''} ${frame}`}
      >
        {children}
      </div>

      {/* Fades toward the card so the crop reads as depth, not as a cut. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_58%,color-mix(in_srgb,var(--color-surface)_88%,transparent))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_62%,color-mix(in_srgb,var(--color-surface)_85%,transparent))]" />
    </div>
  );
}

/** Out-of-focus surroundings: present, legibly shaped, not readable. */
function Soft({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`blur-[1.6px] opacity-45 ${className}`}>{children}</div>;
}

function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-[7px] text-[10.5px] ${className}`}>
      {children}
    </div>
  );
}

function Bar({ w, className = '' }: { w: string; className?: string }) {
  return (
    <span
      className={`inline-block h-[6px] rounded-full bg-[var(--color-line-strong)] ${className}`}
      style={{ width: w }}
    />
  );
}

/**
 * Priced before it starts — the estimate panel, with the figure in focus
 * and the cap it is being checked against softened underneath.
 */
export function PriceShot() {
  return (
    <Shot>
      <Soft>
        <Row className="justify-between">
          <span className="flex items-center gap-2 text-[var(--color-text)]">
            <Bar w="9px" className="h-[9px] w-[9px] rounded-[3px]" />
            minimax/hailuo-2.3
          </span>
          <Bar w="34px" />
        </Row>
      </Soft>

      <div className="mt-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-card)] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] uppercase tracking-wide text-[var(--color-dim)]">
            Estimated
          </span>
          <span className="rounded-full border border-[var(--status-done)]/35 bg-[var(--status-done)]/10 px-1.5 py-[1px] text-[9.5px] text-[var(--status-done)]">
            under cap
          </span>
        </div>
        <div className="mt-1.5 font-mono text-[22px] leading-none tracking-tight text-[var(--color-text)]">
          $0.2800
        </div>
        <div className="mt-1.5 text-[10.5px] text-[var(--color-muted)]">6s · 1080p · before run</div>
      </div>

      <Soft className="mt-2">
        <Row className="justify-between">
          <span className="text-[var(--color-muted)]">Monthly cap</span>
          <Bar w="40px" />
        </Row>
        <div className="mx-2 h-[5px] overflow-hidden rounded-full bg-[var(--color-line)]">
          <div className="h-full w-[22%] rounded-full bg-[var(--color-text)]" />
        </div>
      </Soft>
    </Shot>
  );
}

/**
 * Durable by id — a task fetched long after the connection that started it,
 * its lifecycle readable and the queue around it out of focus.
 */
export function TaskShot() {
  const steps = [
    ['Queued', '14:02:11', 'var(--status-queued)'],
    ['Running', '14:02:12', 'var(--status-running)'],
    ['Completed', '14:03:31', 'var(--status-done)'],
  ] as const;

  return (
    <Shot>
      <Soft>
        <Row className="justify-between">
          <span className="font-mono text-[var(--color-muted)]">task_41d0e7c9</span>
          <Bar w="30px" />
        </Row>
      </Soft>

      <div className="mt-1 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-card)] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-[var(--color-text)]">task_9f2c7a1b</span>
          <span className="text-[9.5px] text-[var(--color-dim)]">fetched 2d later</span>
        </div>

        <ol className="mt-2.5 space-y-[7px]">
          {steps.map(([label, at, tone]) => (
            <li key={label} className="flex items-center gap-2 text-[10.5px]">
              <span
                className="h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ background: tone }}
                aria-hidden
              />
              <span className="text-[var(--color-text)]">{label}</span>
              <span className="ml-auto font-mono text-[9.5px] text-[var(--color-dim)]">{at}</span>
            </li>
          ))}
        </ol>
      </div>

      <Soft className="mt-2">
        <Row className="justify-between">
          <span className="font-mono text-[var(--color-muted)]">task_7b31aa04</span>
          <Bar w="30px" />
        </Row>
      </Soft>
    </Shot>
  );
}

/**
 * Attributed on arrival — the run log, one row legible: a person, the client
 * they used, the key it was charged to.
 */
export function AuditShot() {
  return (
    <Shot>
      <Soft>
        <Row className="justify-between">
          <span className="flex items-center gap-2">
            <Bar w="14px" className="h-[14px] w-[14px] rounded-full" />
            <Bar w="52px" />
          </span>
          <Bar w="26px" />
        </Row>
      </Soft>

      <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-card)] px-2.5 py-2">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--color-periwinkle)] text-[10px] font-medium text-[#141414]">
          MG
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[11px] text-[var(--color-text)]">
            via mcp · Claude Code
          </span>
          <span className="mt-[2px] block truncate font-mono text-[9.5px] text-[var(--color-dim)]">
            sk_live_…a4f2
          </span>
        </span>
        <span className="ml-auto font-mono text-[11px] text-[var(--color-text)]">$0.28</span>
      </div>

      <Soft className="mt-2">
        <Row className="justify-between">
          <span className="flex items-center gap-2">
            <Bar w="14px" className="h-[14px] w-[14px] rounded-full" />
            <Bar w="64px" />
          </span>
          <Bar w="26px" />
        </Row>
        <Row className="justify-between">
          <span className="flex items-center gap-2">
            <Bar w="14px" className="h-[14px] w-[14px] rounded-full" />
            <Bar w="44px" />
          </span>
          <Bar w="26px" />
        </Row>
      </Soft>
    </Shot>
  );
}


/**
 * A payload, cropped the same way the interface shots are.
 *
 * The old version was a tidy figure with the whole body visible and air
 * around it, which read as a diagram. A response is not a diagram — it is
 * something you are looking at a piece of, so this one runs past the card
 * and is cut mid-object, with the highlighting done at build time.
 */
export function PayloadShot({
  label,
  caption,
  json,
  frame,
}: {
  label: string;
  caption: string;
  json: string;
  frame: string;
}) {
  return (
    <Shot frame={frame} padded={false}>
      <div className="flex items-center justify-between gap-6 border-b border-[var(--color-line)] px-3.5 py-2.5">
        <span className="whitespace-nowrap font-mono text-[11.5px] text-[var(--color-text)]">
          {label}
        </span>
        <span className="whitespace-nowrap text-[10.5px] text-[var(--color-dim)]">{caption}</span>
      </div>
      <pre
        className="overflow-hidden px-3.5 py-3 font-mono text-[12px] leading-[1.75] text-[var(--color-muted)]"
        dangerouslySetInnerHTML={{ __html: highlight(json, { lang: 'json' }) }}
      />
    </Shot>
  );
}
