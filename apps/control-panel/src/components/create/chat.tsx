'use client';

import { useChat } from '@ai-sdk/react';
import { newId } from '@sequel/core/ids';
import { PageHeader } from '@sequel/ui';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { GenerationPending, GenerationResult, type RunResult } from './generation-card';

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

    void sendMessage({ text: trimmed });
    setInput('');
  }

  if (empty) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center pb-10">
        <PageHeader
          breadcrumb={['Sequel', 'Create']}
          title="What should we make?"
          meta="Describe it. Sequel picks a model, runs it, and shows you the result."
        />

        <Composer value={input} onChange={setInput} onSubmit={submit} busy={busy} autoFocus />

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
        {messages.map((message) => (
          <Message key={message.id} message={message} />
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
        <Composer value={input} onChange={setInput} onSubmit={submit} busy={busy} />
      </div>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  /*
   * Asymmetric on purpose. What you said is a short, known quantity, so it
   * gets a bubble on the right. What the assistant said is the content of the
   * page — it reads as prose on the background, with nothing boxing it in.
   */
  if (message.role === 'user') {
    const text = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => (part as { text: string }).text)
      .join('\n');

    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-[20px] bg-[var(--color-card)] px-4 py-2.5 text-[14px] leading-relaxed text-[var(--color-text)]">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div key={index} className="chat-prose text-[14px] leading-relaxed">
              <Streamdown>{part.text}</Streamdown>
            </div>
          );
        }

        /*
         * MCP tools arrive as `dynamic-tool` parts with the name in a field,
         * not as `tool-<name>` — the SDK cannot type what it discovers at
         * runtime. Matching on `tool-run_models` silently rendered nothing.
         */
        if (part.type === 'dynamic-tool') {
          if (part.toolName !== 'run_models') {
            // The search and schema steps are on the way to the picture, not
            // the picture. A dot is enough.
            const done = part.state === 'output-available';
            return (
              <div key={index} className="flex items-center gap-2 text-[12px]">
                <span
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: done ? 'var(--status-done)' : 'var(--status-running)' }}
                />
                <span className="font-mono text-[var(--color-dim)]">{part.toolName}</span>
              </div>
            );
          }

          if (part.state === 'output-available') {
            const result = readToolOutput(part.output);
            return result ? <GenerationResult key={index} result={result} /> : null;
          }
          if (part.state === 'output-error') {
            return (
              <div
                key={index}
                className="rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] text-[var(--color-pink)]"
              >
                {part.errorText}
              </div>
            );
          }
          return (
            <GenerationPending
              key={index}
              input={part.input as Record<string, unknown> | undefined}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  busy,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (text: string) => void;
  busy: boolean;
  autoFocus?: boolean;
}) {
  const field = useRef<HTMLTextAreaElement>(null);

  // Grow with the content up to a ceiling, the way every chat composer does.
  useEffect(() => {
    const node = field.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
      className="flex items-end gap-2 rounded-[26px] border border-[var(--color-line)] bg-[var(--color-card)] py-2 pl-5 pr-2 transition-colors focus-within:border-[var(--color-line-strong)]"
    >
      <textarea
        ref={field}
        value={value}
        autoFocus={autoFocus}
        rows={1}
        placeholder="Describe an image, a video, or something to say out loud…"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter is a newline. A prompt is usually one
          // line, and reaching for a button each time would be the friction.
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit(value);
          }
        }}
        className="scroll-area max-h-[200px] flex-1 resize-none bg-transparent py-2 text-[14px] leading-relaxed outline-none placeholder:text-[var(--color-dim)]"
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={busy || !value.trim()}
        className="mb-[1px] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-30"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M8 13V3m0 0L3.6 7.4M8 3l4.4 4.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
