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

/**
 * A thinking step.
 *
 * These were being dropped entirely, which is how a turn ended up showing
 * four tool calls and not one word — the model had reasoned its way into a
 * dead end and said nothing, so the screen just stopped. Thinking is part of
 * what happened and belongs in the record of it.
 */
export interface ReasoningPart {
  type: 'reasoning';
  text: string;
  state?: string;
}

export type TracePart = ToolPart | ReasoningPart;

function isTool(part: TracePart): part is ToolPart {
  return part.type === 'dynamic-tool';
}

/**
 * What the caller said it was doing, if it said.
 *
 * Every tool takes an optional action_info for exactly this. A trace reading
 * search_models / get_model_schemas / run_models describes the shape of the
 * work but not its point, and only the caller knows the point.
 */
function actionInfo(part: ToolPart): string | null {
  const input = part.input as { action_info?: unknown } | undefined;
  const value = input?.action_info;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * A stylised brain: two lobes, a fissure, and one fold each side.
 *
 * Two earlier attempts drew the bumpy outline a brain actually has, with
 * arcs and then with beziers, and both rasterised to a plain circle — at
 * 15px a bulge of 0.7 units in a 16-unit box is about 0.65px on screen and
 * simply disappears. The folds survive because they are interior strokes
 * with clear space around them, so they are what carries the meaning here.
 */
function BrainIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="h-full w-full"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Wider than tall, which is the one proportion that reads as a brain
          and not a head. */}
      <ellipse cx="8" cy="8" rx="5.9" ry="5.2" />
      <path d="M8 2.8v10.4" />
      <path d="M5.3 5.5c1.4.4 2 1.4 1.8 2.9" />
      <path d="M10.7 5.5c-1.4.4-2 1.4-1.8 2.9" />
    </svg>
  );
}

/**
 * One glyph per tool, in place of a status dot.
 *
 * The dot said only 'this finished', which the timing beside it already
 * said. The icon says which of five things happened, so a trace can be read
 * at a glance rather than word by word.
 */
function ToolIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 16 16',
    fill: 'none',
    className: 'h-full w-full',
    'aria-hidden': true,
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'search_models':
      return (
        <svg {...common}>
          <circle cx="7.2" cy="7.2" r="4" />
          <path d="M10.2 10.2L13.5 13.5" />
        </svg>
      );
    case 'get_model_schemas':
      return (
        <svg {...common}>
          <path d="M6 2.5C4.6 2.5 4.5 3.4 4.5 5c0 1.6-.6 2.4-1.8 3 1.2.6 1.8 1.4 1.8 3 0 1.6.1 2.5 1.5 2.5" />
          <path d="M10 2.5c1.4 0 1.5.9 1.5 2.5 0 1.6.6 2.4 1.8 3-1.2.6-1.8 1.4-1.8 3 0 1.6-.1 2.5-1.5 2.5" />
        </svg>
      );
    case 'get_upload_url':
      return (
        <svg {...common}>
          <path d="M8 11V3m0 0L5 6m3-3l3 3" />
          <path d="M2.8 10.5v1.7c0 .6.5 1.1 1.1 1.1h8.2c.6 0 1.1-.5 1.1-1.1v-1.7" />
        </svg>
      );
    case 'run_models':
      return (
        <svg {...common}>
          <path d="M8 2.2l1.5 3.6 3.6 1.5-3.6 1.5L8 12.4 6.5 8.8 2.9 7.3l3.6-1.5L8 2.2z" />
        </svg>
      );
    case 'list_tasks':
      return (
        <svg {...common}>
          <path d="M6.5 4.5h7M6.5 8h7M6.5 11.5h7" />
          <path d="M2.8 4.5h.01M2.8 8h.01M2.8 11.5h.01" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="4.2" />
        </svg>
      );
  }
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
export function duration(ms: number): string {
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
  parts: TracePart[];
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
  const tools = parts.filter(isTool);

  /*
   * A call left unfinished with the turn closed did not finish — it was cut
   * off, by a reload, a navigation or a dropped connection. Treating 'not
   * done' as 'running' is what made a restored chat spin forever: the browser
   * was animating a tool call that stopped existing minutes ago.
   */
  const stopped = !running && tools.some((part) => !isDone(part.state));

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
      if (!isTool(part)) continue;
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
  const count = `${tools.length} tool call${tools.length === 1 ? '' : 's'}`;
  /* Failures are summarised here and detailed inside, so a turn that limped
     to a good answer still says so — without three red boxes in the reply. */
  const failures = tools.filter((part) => part.state === 'output-error').length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        className="nav-item flex items-center gap-2 text-left text-[13px]"
      >
        {/* Only while it is working. A settled turn needs no status light —
            'Worked for 12s' already says it finished, and 'Stopped' says it
            did not. */}
        {running && (
          <span className="spin-slow h-3 w-3 shrink-0 rounded-full border-[1.5px] border-[var(--color-line-strong)] border-t-[var(--status-running)]" />
        )}

        {/* Tabular figures: this ticks every 100ms while a turn is open, and
            proportional digits make it and everything after it jitter
            sideways on each frame. */}
        <span
          className={`nums ${running ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}
        >
          {label}
        </span>
        <span className="text-[var(--color-dim)]">·</span>
        <span className="text-[var(--color-dim)]">{count}</span>
        {failures > 0 && (
          <>
            <span className="text-[var(--color-dim)]">·</span>
            <span className="text-[var(--status-failed)]">{failures} failed</span>
          </>
        )}

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
          <ol>
            {parts.map((part, position) => {
              if (!isTool(part)) {
                const key = `reasoning-${position}`;
                const isOpen = expanded === key;
                return (
                  <li key={key} className="relative pl-6">
                    <span
                      className="absolute -left-[2px] top-[6px] h-[15px] w-[15px] text-[var(--color-line-strong)]"
                      aria-hidden
                    >
                      <BrainIcon />
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : key)}
                      className="nav-item flex items-center gap-2 py-1 text-left"
                    >
                      <span className="text-[12.5px] text-[var(--color-muted)]">Thought</span>
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
                    {/* Prose, not JSON — the one item in the trace written to
                        be read, so it gets no panel around it. */}
                    {isOpen && (
                      <p className="scroll-area mb-2 max-h-[180px] overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--color-muted)]">
                        {part.text}
                      </p>
                    )}
                  </li>
                );
              }

              const done = isDone(part.state);
              const failed = part.state === 'output-error';
              const cut = !done && !running;
              const ms = elapsed(part);
              const isOpen = expanded === part.toolCallId;
              const info = actionInfo(part);

              return (
                <li key={part.toolCallId} className="relative pl-6">
                  {/* Colour still carries the status, now on the glyph rather
                      than beside it. */}
                  <span
                    className="absolute -left-[2px] top-[6px] h-[15px] w-[15px]"
                    style={{
                      color: failed
                        ? 'var(--status-failed)'
                        : cut
                          ? 'var(--status-queued)'
                          : done
                            ? 'var(--color-muted)'
                            : 'var(--status-running)',
                    }}
                    aria-hidden
                  >
                    <ToolIcon name={part.toolName} />
                  </span>

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : part.toolCallId)}
                    className="nav-item flex min-w-0 items-center gap-2 py-1 text-left"
                  >
                    {/* What it said it was doing, where it said. The tool name
                        stays alongside either way — it is the thing you scan
                        for when you are reading the trace as a sequence of
                        calls rather than a story. */}
                    {info && (
                      <span className="truncate text-[12.5px] text-[var(--color-text)]">
                        {info}
                      </span>
                    )}
                    <span
                      className={`shrink-0 font-mono text-[12.5px] ${
                        info ? 'text-[var(--color-dim)]' : 'text-[var(--color-text)]'
                      }`}
                    >
                      {part.toolName}
                    </span>
                    <span className="shrink-0 font-mono text-[11.5px] text-[var(--color-dim)]">
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
                            ? explainToolError(part.errorText)
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


/**
 * What went wrong, in a sentence, with the raw text underneath it.
 *
 * These used to be rendered in the reply itself, which meant a turn that
 * failed twice and then succeeded showed two red boxes above the picture it
 * eventually made. A failure is a detail of how the work went, so it belongs
 * in the trace with the rest of it — and the count in the header is what
 * says it happened at all.
 */
function explainToolError(raw: string | undefined): string {
  const text = raw ?? 'The tool call failed.';

  if (/Unterminated string|Unexpected end of JSON|Expected double-quoted/i.test(text)) {
    return `The model cut its own tool call off mid-JSON — it tried to send too much at once.\n\n${text}`;
  }

  // Drop the quoted payload between 'Text:' and the actual message.
  return text.replace(/Text:[\s\S]*?Error message:/, '').trim();
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
