'use client';

import { useChat } from '@ai-sdk/react';
import { newId } from '@sequel/core/ids';
import { PageHeader } from '@sequel/ui';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { Composer, type Attachment } from './composer';
import { GenerationPending, GenerationResult, type RunResult } from './generation-card';
import { duration, ToolTimeline, type ToolPart, type TracePart } from './tool-timeline';

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

export function CreateChat({
  chatId: existingChatId,
  initialMessages,
}: {
  chatId?: string;
  initialMessages?: UIMessage[];
}) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // When the current turn was asked for, so the indicator can count up. Null
  // between turns.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  /*
   * The id is minted here, before the first message exists.
   *
   * It lets the URL become /c/<id> the instant you hit send, with
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

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    if (!existingChatId && messages.length === 0) {
      window.history.replaceState(null, '', `/c/${chatId}`);
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
          title="What should we make?"
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
    <div className="mx-auto -mb-8 flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col">
      <div className="flex-1 space-y-6 py-2">
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

      <div className="sticky bottom-0 bg-[var(--color-bg)] pb-6 pt-3">
        <Composer {...composer} />
      </div>
    </div>
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
              <Streamdown>{block.text}</Streamdown>
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
