'use client';

import { useParams } from 'next/navigation';

import { useChat } from '@ai-sdk/react';
import { AssetsPanel, type ChatAsset } from './assets-panel';
import Link from 'next/link';
import { newId } from '@sequel/core/ids';
import { PageHeader } from '@sequel/ui';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { createHighlightsPlugin } from '@pierre/words/highlights';
import { Markdown } from '@pierre/words/react';
import nightOwl from '@pierre/highlights/themes/night-owl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatActionsProvider, type EditRequest } from './chat-actions';
import { Composer, type Attachment } from './composer';
import { GenerationPending, GenerationResult, type RunResult } from './generation-card';
import { duration, ToolTimeline, type ToolPart, type TracePart } from './tool-timeline';
import { teamPath } from '@/lib/team-path';

/*
 * One highlighter for the whole page, built here rather than in the component
 * that uses it: it carries a Wasm instance and a parsed theme, and @pierre/words
 * asks for it to be made once, outside the render.
 *
 * Night Owl, because the docs' code blocks are already Night Owl — the
 * `--sh-*` palette in globals.css is the same set, mapped onto sugar-high's
 * nine tokens. A chat answer and a docs page showing the same snippet in two
 * different colour schemes is the sort of thing nobody can name but everyone
 * notices.
 */
const codeHighlighter = createHighlightsPlugin({ theme: nightOwl });

/**
 * The turn is running, and how long it has been running for.
 *
 * Shown from the moment you send until the stream settles, which includes
 * the stretch before the first tool call when the model is only thinking and
 * the trace has nothing in it yet — the gap that used to read as nothing
 * happening.
 */
function StreamingIndicator({ startedAt }: { startedAt: number }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2.5 text-[var(--color-muted)]">
      <span className="dot-pulse" aria-hidden>
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={index}
            // Diagonal, so the pulse travels rather than blinking as a block.
            style={{
              animationDelay: `-${(((index % 3) + Math.floor(index / 3)) * 0.12).toFixed(2)}s`,
            }}
          />
        ))}
      </span>
      <span className="nums text-[13px] text-[var(--color-dim)]">
        {duration(Date.now() - startedAt)}
      </span>
      <span className="sr-only">Working</span>
    </div>
  );
}

/**
 * Separates what you typed from the attachment list appended for the model.
 *
 * Both have to be in the same text part — that is what reaches the model —
 * but only the first half is yours, so the bubble renders up to this marker.
 */
const ATTACHMENT_NOTE = '\n\nAttached files (pass the URL as file_url when running a model):\n';

const SUGGESTIONS = [
  'A product photo of a ceramic mug on seamless white',
  'A 5-second video of steam rising from a coffee cup',
  'Read this in a warm voice: your order is on its way',
];

/**
 * MCP tool results arrive as `{ content: [{ type: 'text', text: '<json>' }] }`
 * because our tools declare no output schema. Parse it here rather than make
 * every caller know that.
 */
function readToolOutput(output: unknown): RunResult[] {
  if (!output || typeof output !== 'object') return [];
  const content = (output as { content?: Array<{ type: string; text?: string }> }).content;
  const text = content?.find((part) => part.type === 'text')?.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as RunResult & { runs?: RunResult[] };
    // A batch answers with `runs`; a single run answers with itself.
    return Array.isArray(parsed.runs) ? parsed.runs : [parsed];
  } catch {
    return [];
  }
}

/** Relative, and coarse: the exact minute a chat was last touched is noise. */
function when(iso: string): string {
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}

export interface RecentChat {
  id: string;
  title: string | null;
  updatedAt: string;
}

export function CreateChat({
  chatId: existingChatId,
  initialMessages,
  recent = [],
  title,
}: {
  chatId?: string;
  initialMessages?: UIMessage[];
  /** Newest first. Only rendered on the empty state. */
  recent?: RecentChat[];
  /** Shown in the trail at the top of an open chat. */
  title?: string | null;
}) {
  const { team } = useParams<{ team: string }>();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // When the current turn was asked for, so the indicator can count up. Null
  // between turns.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  /*
   * The id is minted here, before the first message exists.
   *
   * It lets the URL become /<team>/c/<id> the instant you hit send, with
   * replaceState rather than a navigation — a route change would tear down
   * the component and with it the open stream.
   */
  const [chatId] = useState(() => existingChatId ?? newId('chat'));

  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages: outgoing }) => ({
        body: { chatId, messages: outgoing },
      }),
    }),
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const busyNow = status === 'submitted' || status === 'streaming';
  useEffect(() => {
    // Clear on settle so a finished turn does not leave a frozen clock.
    if (!busyNow) setStartedAt(null);
  }, [busyNow]);

  const busy = status === 'submitted' || status === 'streaming';
  const empty = messages.length === 0;
  const [assetsOpen, setAssetsOpen] = useState(false);

  /*
   * Read out of the messages rather than fetched. The conversation already
   * holds every run's result, and a second source could disagree with what
   * is on screen — including mid-stream, where the panel should fill as the
   * runs land.
   */
  const assets = useMemo<ChatAsset[]>(() => {
    const out: ChatAsset[] = [];
    for (const message of messages) {
      for (const part of message.parts) {
        /* MCP tools arrive as 'dynamic-tool' — they are discovered at
           runtime, so the SDK cannot give them a `tool-<name>` type. The
           prefix check alone matched nothing, which is why the panel came up
           empty on a chat full of images. */
        if (part.type !== 'dynamic-tool' && !part.type.startsWith('tool-')) continue;
        const { output, input } = part as { output?: unknown; input?: Record<string, unknown> };
        for (const run of readToolOutput(output)) {
          for (const asset of run.assets ?? []) {
            if (asset.url) {
              out.push({
                url: asset.url,
                mime: asset.mime,
                taskId: run.task_id,
                cost: run.cost,
                input,
              });
            }
          }
        }
      }
    }
    return out;
  }, [messages]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    if (!existingChatId && messages.length === 0) {
      window.history.replaceState(null, '', teamPath(team, `/c/${chatId}`));
    }

    /*
     * Files ride along as parts so the message renders with them, and their
     * links are spelled out in the text as well.
     *
     * The chat model is text-only — it cannot look at an attachment. What it
     * needs is the URL, because that is what it passes to run_models as
     * file_url. Without this line it knows a file exists and has no way to
     * refer to it.
     */
    const note = attachments.length
      ? ATTACHMENT_NOTE +
        attachments.map((file) => `- ${file.name} (${file.mime}): ${file.url}`).join('\n')
      : '';

    setStartedAt(Date.now());
    void sendMessage({
      text: trimmed + note,
      files: attachments.map((file) => ({
        type: 'file' as const,
        url: file.url,
        mediaType: file.mime,
        filename: file.name,
      })),
    });

    setInput('');
    setAttachments([]);
  }

  /** Send a message carrying one already-hosted file. */
  function sendWithFile(text: string, file: Attachment) {
    setStartedAt(Date.now());
    void sendMessage({
      text:
        text +
        ATTACHMENT_NOTE +
        `- ${file.name} (${file.mime}): ${file.url}`,
      files: [
        { type: 'file' as const, url: file.url, mediaType: file.mime, filename: file.name },
      ],
    });
  }

  /*
   * An edit started from the image viewer.
   *
   * Anything drawn arrives as a data URL and has to be hosted before a model
   * can fetch it, so it goes through the same upload the paperclip uses and
   * lands in the same chatFile table.
   */
  async function submitEdit(request: EditRequest) {
    if (busy) return;

    if (request.dataUrl) {
      const blob = await (await fetch(request.dataUrl)).blob();
      const body = new FormData();
      body.append('file', new File([blob], 'edit.png', { type: blob.type || 'image/png' }));
      const response = await fetch(`/api/chat/${chatId}/files`, { method: 'POST', body });
      if (!response.ok) throw new Error('Could not upload the edited image.');
      sendWithFile(request.text, (await response.json()) as Attachment);
      return;
    }

    if (!request.url) return;
    // Already hosted — Remove BG and Resize act on the generation as it is.
    sendWithFile(request.text, {
      id: request.url,
      name: 'image',
      mime: request.mime ?? 'image/png',
      bytes: 0,
      url: request.url,
    });
  }

  const composer = {
    value: input,
    onChange: setInput,
    onSubmit: submit,
    busy,
    chatId,
    attachments,
    onAttach: (file: Attachment) => setAttachments((files) => [...files, file]),
    onRemove: (id: string) =>
      setAttachments((files) => files.filter((file) => file.id !== id)),
  };

  if (empty) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center pb-10">
        <PageHeader
          breadcrumb={['Sequel', 'Create']}
          title="What should we create?"
          meta="Describe it. Sequel picks a model, runs it, and shows you the result."
        />

        <Composer {...composer} autoFocus />

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="rounded-full border border-[var(--color-line)] px-3.5 py-2 text-left text-[13px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-text)]"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Below the composer, not above it: the point of this screen is the
            empty box, and a list of what you did yesterday should not be the
            first thing competing with it. */}
        {recent.length > 0 && (
          <div className="mt-12">
            <div className="mb-2.5 text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
              Recent
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
              {recent.map((chat, index) => (
                <Link
                  key={chat.id}
                  href={teamPath(team, `/c/${chat.id}`)}
                  className={[
                    'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-card-hover)]',
                    index > 0 ? 'border-t border-[var(--color-line)]' : '',
                  ].join(' ')}
                >
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--color-text)]">
                    {chat.title ?? 'Untitled'}
                  </span>
                  <span className="nums shrink-0 text-[12px] text-[var(--color-dim)]">
                    {when(chat.updatedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    /*
     * Reaches the bottom of the window, not the bottom of the layout's
     * padding.
     *
     * The dashboard's main element is py-8, so a column sized to
     * 100vh-4rem stops 2rem short and the sticky composer rests on that
     * shelf — until the conversation is long enough to scroll, at which
     * point it detaches and the gap vanishes. The negative margin eats the
     * layout's bottom padding so the height can account for only the top.
     */
    <ChatActionsProvider value={{ chatId, submitEdit }}>
      {/* A row: the conversation and, when it is open, the assets column
          beside it. The conversation is what gives up the width. */}
      <div className="-mb-8 flex min-h-[calc(100vh-2rem)] gap-8">
        <div className="flex min-w-0 flex-1 flex-col">
        {/* The way back. A chat is reached from Create and from the recent
            list, and until now it had no exit but the browser's own.

            The bar itself has no background: a band across the top is the
            same hard edge the composer used to draw at the bottom. The pill
            carries its own fill, so the conversation passes behind it. */}
        <nav
          aria-label="Breadcrumb"
          /* -mt-4 pulls it up out of the layout's top padding, and the thin
             pt is what it rests on once stuck — at py-3 it sat a third of
             the way down the gap and read as floating in the middle. */
          /* Full width of the screen, not of the column: the trail belongs
             to the page, and tucking it into the measure put it adrift in
             the middle of a wide window. */
          className="sticky top-0 z-20 -mt-4 mb-2 flex items-center justify-between gap-3 pb-3 pt-2"
        >
          {/* Same glass as the composer: the conversation scrolls under this
              too, and an opaque pill over it reads as a lid. */}
          <span className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-[#1a1a1a]/55 pl-2.5 pr-4 text-[13px] shadow-[0_14px_40px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
            <Link
              href={teamPath(team, '')}
              aria-label="Back to Create"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="M10 4 6 8l4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <Link
              href={teamPath(team, '')}
              className="shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              Create
            </Link>
            <span className="shrink-0 text-[var(--color-dim)]">/</span>
            <span className="min-w-0 truncate text-[var(--color-text)]">{title ?? 'Untitled'}</span>
          </span>

          {/* Same glass, same height, opposite end. Disabled rather than
              hidden when the chat has made nothing: a control that appears
              and disappears is harder to find than one that is simply off. */}
          <button
            type="button"
            onClick={() => setAssetsOpen((value) => !value)}
            aria-expanded={assetsOpen}
            disabled={assets.length === 0}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-[#1a1a1a]/55 px-4 text-[13px] text-[var(--color-text)] shadow-[0_14px_40px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-colors hover:border-white/20 disabled:text-[var(--color-dim)] disabled:hover:border-white/10"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
              <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
              <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            Assets
            {assets.length > 0 && (
              <span className="nums text-[var(--color-dim)]">{assets.length}</span>
            )}
          </button>
        </nav>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 py-2">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            // Only the last message can still be arriving.
            streaming={busy && index === messages.length - 1}
          />
        ))}

        {busy && startedAt !== null && <StreamingIndicator startedAt={startedAt} />}

        {error && (
          <div className="rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] text-[var(--color-pink)]">
            {error.message}
          </div>
        )}

        <div ref={bottom} />
      </div>

        {/*
          * No opaque band here. A solid background behind a sticky composer
          * draws a hard horizontal edge across whatever is scrolling under
          * it — an image cut in half mid-scroll looks like a rendering bug.
          * The gradient dissolves the content into the page instead, and the
          * composer's own blur handles what passes directly behind it.
          */}
        <div className="pointer-events-none sticky bottom-0 z-10 bg-gradient-to-t from-[var(--color-bg)] from-40% to-transparent pb-6 pt-14">
          <div className="pointer-events-auto mx-auto w-full max-w-3xl">
            <Composer {...composer} />
          </div>
        </div>
        </div>

        <AssetsPanel assets={assets} open={assetsOpen} onClose={() => setAssetsOpen(false)} />
      </div>
    </ChatActionsProvider>
  );
}

function Message({ message, streaming }: { message: UIMessage; streaming?: boolean }) {
  /*
   * Asymmetric on purpose. What you said is a short, known quantity, so it
   * gets a bubble on the right. What the assistant said is the content of the
   * page — it reads as prose on the background, with nothing boxing it in.
   */
  if (message.role === 'user') {
    const text = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => (part as { text: string }).text)
      .join('\n')
      .split(ATTACHMENT_NOTE)[0] ?? '';

    const files = message.parts.filter((part) => part.type === 'file') as Array<{
      url: string;
      mediaType?: string;
      filename?: string;
    }>;

    return (
      <div className="flex flex-col items-end gap-1.5">
        {files.length > 0 && (
          <div className="flex max-w-[80%] flex-wrap justify-end gap-1.5">
            {files.map((file) => (
              <a
                key={file.url}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl bg-[var(--color-card)]"
              >
                {file.mediaType?.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt={file.filename ?? 'Attachment'}
                    className="h-28 w-auto max-w-[220px] object-cover"
                  />
                ) : (
                  <span className="block px-3 py-2 text-[12px] text-[var(--color-muted)]">
                    {file.filename ?? 'Attachment'}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {text.trim() && (
          <div className="max-w-[80%] whitespace-pre-wrap rounded-[20px] bg-[var(--color-card)] px-4 py-2.5 text-[14px] leading-relaxed text-[var(--color-text)]">
            {text}
          </div>
        )}
      </div>
    );
  }

  const parts = blocks(message);

  /*
   * A turn with no prose in it.
   *
   * The model can reason itself into a corner, run its tools and then simply
   * stop — which rendered as a trace and nothing else, and reads as the app
   * having broken. Say that it ended without an answer, so the next message
   * can be about that rather than 'What happened?'.
   */
  const silent =
    !streaming && parts.length > 0 && !parts.some((block) => block.kind === 'text');

  return (
    <div className="space-y-3">
      {parts.map((block, index) => {
        if (block.kind === 'text') {
          return (
            <div key={index} className="chat-prose text-[14px] leading-relaxed">
              {/*
                `isAnimating` is what tells the renderer the text is still
                arriving, and it must be true only for the block actually at
                the end of the stream — while it is set, unfinished emphasis,
                fences and links are completed so a half-written `**` does not
                flash as asterisks, and the caret sits after the last
                character.
              */}
              <Markdown
                isAnimating={streaming && index === parts.length - 1}
                caret="block"
                lineNumbers={false}
                plugins={{ code: codeHighlighter }}
              >
                {block.text}
              </Markdown>
            </div>
          );
        }

        /*
         * One accordion per run of calls, and the generations they produced
         * below it. The trace and the result are different things: the trace
         * is how the assistant got there and stays folded away, the picture is
         * what was asked for and is always on screen.
         */
        return (
          <div key={index} className="space-y-3">
            <ToolTimeline
              parts={block.parts}
              metadata={message.metadata}
              // Only the final block of the final message is still open; an
              // earlier run of calls was closed by the text that followed it.
              streaming={streaming && index === parts.length - 1}
            />
            {block.parts
              .filter((part): part is ToolPart => part.type === 'dynamic-tool')
              .filter((part) => part.toolName === 'run_models')
              .map((part) => (
                <Generation
                  key={part.toolCallId}
                  part={part}
                  streaming={streaming && index === parts.length - 1}
                />
              ))}
          </div>
        );
      })}

      {silent && (
        <p className="text-[13px] text-[var(--color-muted)]">
          That turn ended without a reply. Open the trace above to see how far it got, or
          ask again.
        </p>
      )}
    </div>
  );
}

/**
 * Lay a batch out as a grid, a single run full width.
 *
 * Two columns from two runs up, three from five, which keeps a pair large
 * and stops a set of eight becoming a column you have to scroll.
 */
function Grid({ count, children }: { count: number; children: React.ReactNode }) {
  if (count < 2) return <>{children}</>;
  return (
    <div
      className="mt-2 grid gap-2"
      style={{ gridTemplateColumns: `repeat(${count >= 5 ? 3 : 2}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

/** The per-run arguments, whether this was one run or a batch of them. */
function runInputs(input: unknown): Array<Record<string, unknown>> {
  const args = input as
    | {
        runs?: Array<Record<string, unknown>>;
        prompts?: string[];
        input?: Record<string, unknown>;
        model?: string;
      }
    | undefined;

  if (Array.isArray(args?.runs)) return args.runs;

  // The prompts shorthand: one frame per prompt, sharing the rest.
  if (Array.isArray(args?.prompts)) {
    return args.prompts.map((prompt) => ({
      model: args.model,
      input: { ...(args.input ?? {}), prompt },
    }));
  }

  return args ? [args as Record<string, unknown>] : [{}];
}

/**
 * Shorten a tool error to something a person can read.
 *
 * When the model truncates its own tool call, the SDK reports the failure by
 * quoting every byte it did manage to emit — which for a batch is hundreds
 * of words of broken JSON filling the conversation. The payload is already
 * in the trace if anyone wants it; what belongs here is what went wrong.
 */
function toolErrorText(raw: string | undefined): string {
  const text = raw ?? 'The tool call failed.';

  if (/Unterminated string|Unexpected end of JSON|Expected double-quoted/i.test(text)) {
    return 'The model cut its own tool call off mid-JSON — it tried to send too much at once. Asking for fewer at a time usually gets through.';
  }

  // Drop the quoted payload between 'Text:' and the actual message.
  const trimmed = text.replace(/Text:[\s\S]*?Error message:/, '').trim();
  return trimmed.length > 240 ? `${trimmed.slice(0, 237)}…` : trimmed;
}

function Generation({ part, streaming }: { part: ToolPart; streaming?: boolean }) {
  /*
   * Nothing until the arguments are complete.
   *
   * While they stream in, a `prompts` array grows an entry at a time, so the
   * grid would render one frame at full width, then two at half, then three
   * — resizing itself underneath you before a single pixel of image exists.
   * The chat-level indicator already shows the turn is live, so there is
   * nothing to cover here but a short gap.
   */
  if (part.state === 'input-streaming') return null;

  const inputs = runInputs(part.input);

  if (part.state === 'output-available') {
    const results = readToolOutput(part.output);
    if (results.length === 0) return null;
    return (
      <Grid count={results.length}>
        {results.map((result, index) => (
          <GenerationResult
            key={index}
            result={result}
            input={inputs[index] ?? inputs[0]}
            inGrid={results.length > 1}
          />
        ))}
      </Grid>
    );
  }

  if (part.state === 'output-error') {
    return (
      <div
        className="rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] text-[var(--color-pink)]"
        title={part.errorText}
      >
        {toolErrorText(part.errorText)}
      </div>
    );
  }

  /*
   * Unfinished and nothing streaming means the run was cut off, not that it
   * is still going. Shimmering here is a lie that never resolves.
   */
  if (!streaming) {
    return (
      <div className="rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] text-[var(--color-muted)]">
        This generation was interrupted. The run may still have finished — check Tasks.
      </div>
    );
  }

  // One placeholder per run, so a batch of six reserves six frames rather
  // than one that later multiplies.
  return (
    <Grid count={inputs.length}>
      {inputs.map((args, index) => (
        <GenerationPending key={index} input={args} inGrid={inputs.length > 1} />
      ))}
    </Grid>
  );
}

type Block =
  | { kind: 'text'; text: string }
  | { kind: 'tools'; parts: TracePart[] };

/**
 * Collapse the part list into blocks, merging consecutive tool calls.
 *
 * The model calls search, then schemas, then run, with nothing said in
 * between — three separate accordions for one stretch of work would be worse
 * than the three dots this replaced. A sentence between calls does split
 * them, because then the assistant has genuinely started a second thing.
 *
 * MCP tools arrive as `dynamic-tool` parts with the name in a field, not as
 * `tool-<name>`: the SDK cannot type what it discovers at runtime.
 */
function blocks(message: UIMessage): Block[] {
  const out: Block[] = [];

  for (const part of message.parts) {
    if (part.type === 'text') {
      out.push({ kind: 'text', text: part.text });
      continue;
    }
    // Reasoning joins the trace rather than being dropped. Interleaved with
    // the calls it explains, which is the order it happened in.
    if (part.type !== 'dynamic-tool' && part.type !== 'reasoning') continue;

    const last = out[out.length - 1];
    if (last?.kind === 'tools') last.parts.push(part as TracePart);
    else out.push({ kind: 'tools', parts: [part as TracePart] });
  }

  return out;
}
