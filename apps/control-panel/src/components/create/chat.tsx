'use client';

import { useChat } from '@ai-sdk/react';
import { newId } from '@sequel/core/ids';
import { PageHeader } from '@sequel/ui';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { Composer, type Attachment } from './composer';
import { GenerationPending, GenerationResult, type RunResult } from './generation-card';
import { ToolTimeline, type ToolPart } from './tool-timeline';

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
function readToolOutput(output: unknown): RunResult | null {
  if (!output || typeof output !== 'object') return null;
  const content = (output as { content?: Array<{ type: string; text?: string }> }).content;
  const text = content?.find((part) => part.type === 'text')?.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as RunResult;
  } catch {
    return null;
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col">
      <div className="flex-1 space-y-6 py-2">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            // Only the last message can still be arriving.
            streaming={busy && index === messages.length - 1}
          />
        ))}

        {status === 'submitted' && (
          <div className="text-[13px] text-[var(--color-dim)]">Thinking…</div>
        )}

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
    </div>
  );
}

function Generation({ part, streaming }: { part: ToolPart; streaming?: boolean }) {
  if (part.state === 'output-available') {
    const result = readToolOutput(part.output);
    return result ? (
      <GenerationResult
        result={result}
        input={part.input as Record<string, unknown> | undefined}
      />
    ) : null;
  }
  if (part.state === 'output-error') {
    return (
      <div className="rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] text-[var(--color-pink)]">
        {part.errorText}
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

  return <GenerationPending input={part.input as Record<string, unknown> | undefined} />;
}

type Block =
  | { kind: 'text'; text: string }
  | { kind: 'tools'; parts: ToolPart[] };

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
    if (part.type !== 'dynamic-tool') continue;

    const last = out[out.length - 1];
    if (last?.kind === 'tools') last.parts.push(part as ToolPart);
    else out.push({ kind: 'tools', parts: [part as ToolPart] });
  }

  return out;
}
