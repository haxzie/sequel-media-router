'use client';

import { useEffect, useRef, useState } from 'react';

export interface ToolPart {
  type: 'dynamic-tool';
  toolCallId: string;
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

/** Server-measured timings, attached to the assistant message at finish. */
export interface ChatMetadata {
  totalMs?: number;
  toolMs?: Record<string, number>;
}

export function readMetadata(metadata: unknown): ChatMetadata {
  return metadata && typeof metadata === 'object' ? (metadata as ChatMetadata) : {};
}

function isDone(state: string) {
  return state === 'output-available' || state === 'output-error';
}

/**
 * '4.2s' under ten seconds, then whole seconds, then minutes.
 *
 * Tenths matter when a call takes two seconds and read like noise when it
 * takes ninety.
 */
function duration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function pretty(value: unknown): string {
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * MCP results are `{ content: [{ type: 'text', text: '<json>' }] }`. Showing
 * that envelope would mean reading an escaped JSON string inside a JSON
 * object — unwrap it so the panel shows what the tool actually returned.
 */
function readOutput(output: unknown): string {
  if (!output || typeof output !== 'object') return pretty(output);
  const content = (output as { content?: Array<{ type: string; text?: string }> }).content;
  const text = content?.find((part) => part.type === 'text')?.text;
  if (!text) return pretty(output);
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/**
 * The trace of what the assistant did to answer, collapsed by default.
 *
 * Every call is listed, run_models included, so the count is the truth about
 * the turn. The picture it produced is rendered separately — this is the
 * record of the work, not the result of it.
 */
export function ToolTimeline({
  parts,
  metadata,
  streaming,
}: {
  parts: ToolPart[];
  metadata?: unknown;
  /**
   * Whether the assistant's turn is still open.
   *
   * Part state alone is not enough: between two calls every part is settled
   * while the model decides what to do next, and the header would flip to
   * 'Worked for 561ms' mid-turn and then start counting again.
   */
  streaming?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { totalMs, toolMs } = readMetadata(metadata);
  const running = Boolean(streaming);

  /*
   * A call left unfinished with the turn closed did not finish — it was cut
   * off, by a reload, a navigation or a dropped connection. Treating 'not
   * done' as 'running' is what made a restored chat spin forever: the browser
   * was animating a tool call that stopped existing minutes ago.
   */
  const stopped = !running && parts.some((part) => !isDone(part.state));

  /*
   * Client-side stopwatch, for the live case only.
   *
   * The server's timings are authoritative and arrive at the end; until then
   * the only thing that knows a call is in flight is the part state, so note
   * when each one first appears and when it settles.
   */
  const starts = useRef(new Map<string, number>());
  const ends = useRef(new Map<string, number>());
  const [, tick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    for (const part of parts) {
      if (!starts.current.has(part.toolCallId)) starts.current.set(part.toolCallId, now);
      if (isDone(part.state) && !ends.current.has(part.toolCallId)) {
        ends.current.set(part.toolCallId, now);
      }
    }
  }, [parts]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => tick((n) => n + 1), 100);
    return () => clearInterval(timer);
  }, [running]);

  function elapsed(part: ToolPart): number | null {
    const measured = toolMs?.[part.toolCallId];
    if (measured !== undefined) return measured;
    const start = starts.current.get(part.toolCallId);
    if (start === undefined) return null;
    const end = ends.current.get(part.toolCallId);
    // Only a live call may count against the clock. For a restored one the
    // 'start' is when this component mounted, which measures nothing.
    if (end === undefined && !running) return null;
    return (end ?? Date.now()) - start;
  }

  function total(): number | null {
    if (totalMs !== undefined) return totalMs;
    if (!running && stopped) return null;
    const first = Math.min(...[...starts.current.values()]);
    if (!Number.isFinite(first)) return null;
    if (running) return Date.now() - first;
    const last = Math.max(...[...ends.current.values()]);
    return Number.isFinite(last) ? last - first : null;
  }

  const spent = total();
  const label = running
    ? `Working${spent === null ? '' : ` for ${duration(spent)}`}`
    : stopped
      ? `Stopped${spent === null ? '' : ` after ${duration(spent)}`}`
      : `Worked for ${spent === null ? 'a moment' : duration(spent)}`;
  const count = `${parts.length} tool call${parts.length === 1 ? '' : 's'}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        className="nav-item flex items-center gap-2 text-left text-[13px]"
      >
        {running ? (
          <span className="spin-slow h-3 w-3 shrink-0 rounded-full border-[1.5px] border-[var(--color-line-strong)] border-t-[var(--status-running)]" />
        ) : (
          <span
            className="h-[6px] w-[6px] shrink-0 rounded-full"
            style={{ background: stopped ? 'var(--status-queued)' : 'var(--status-done)' }}
          />
        )}

        <span className={running ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}>
          {label}
        </span>
        <span className="text-[var(--color-dim)]">·</span>
        <span className="text-[var(--color-dim)]">{count}</span>

        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 text-[var(--color-dim)] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path
            d="M4 6.5L8 10.5L12 6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="pt-1">
          {/* The rail is one continuous line behind the dots, so the calls
              read as a sequence rather than a list of unrelated rows. */}
          <ol className="relative">
            <span
              className="absolute left-[5px] top-3 bottom-3 w-px bg-[var(--color-line)]"
              aria-hidden
            />

            {parts.map((part) => {
              const done = isDone(part.state);
              const failed = part.state === 'output-error';
              const cut = !done && !running;
              const ms = elapsed(part);
              const isOpen = expanded === part.toolCallId;

              return (
                <li key={part.toolCallId} className="relative pl-6">
                  <span
                    className="absolute left-[2px] top-[13px] h-[7px] w-[7px] rounded-full ring-[3px] ring-[var(--color-bg)]"
                    style={{
                      background: failed
                        ? 'var(--status-failed)'
                        : done
                          ? 'var(--status-done)'
                          : cut
                            ? 'var(--status-queued)'
                            : 'var(--status-running)',
                    }}
                    aria-hidden
                  />

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : part.toolCallId)}
                    className="nav-item flex items-center gap-2 py-2 text-left"
                  >
                    <span className="font-mono text-[12.5px] text-[var(--color-text)]">
                      {part.toolName}
                    </span>
                    <span className="font-mono text-[11.5px] text-[var(--color-dim)]">
                      {cut ? 'interrupted' : ms === null ? '' : duration(ms)}
                    </span>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                      className={`h-3 w-3 shrink-0 text-[var(--color-dim)] transition-transform ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                    >
                      <path
                        d="M6 4L10 8L6 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="mb-2 space-y-2">
                      <Payload label="Input" body={pretty(part.input)} />
                      <Payload
                        label={failed ? 'Error' : 'Output'}
                        body={
                          failed
                            ? (part.errorText ?? 'Failed.')
                            : cut
                              ? 'Interrupted before this call returned.'
                              : readOutput(part.output)
                        }
                        pending={!done && !cut}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

/*
 * Fixed height, always. A search_models result is a few hundred lines of
 * catalog; letting it set its own height would push the conversation off
 * screen every time you opened one.
 */
function Payload({ label, body, pending }: { label: string; body: string; pending?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg bg-[var(--color-card)]">
      <div className="px-2.5 pt-2 text-[10.5px] uppercase tracking-wide text-[var(--color-dim)]">
        {label}
      </div>
      <pre className="scroll-area h-[180px] overflow-auto px-2.5 pb-2.5 pt-1 font-mono text-[11.5px] leading-[1.6] text-[var(--color-muted)]">
        {pending ? 'Running…' : body}
      </pre>
    </div>
  );
}
