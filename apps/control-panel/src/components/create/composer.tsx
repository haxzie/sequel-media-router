'use client';

import { useEffect, useRef, useState } from 'react';

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  bytes: number;
  url: string;
}

/** A file the browser is still sending. Has no id or url yet. */
interface Pending {
  key: string;
  name: string;
  error?: string;
}

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Two rows: what you are saying, then what you can do with it.
 *
 * The controls sit on their own line rather than flanking the text, so the
 * field keeps its full width as it grows and the buttons never move
 * horizontally when it does.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  busy,
  autoFocus,
  chatId,
  attachments,
  onAttach,
  onRemove,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (text: string) => void;
  busy: boolean;
  autoFocus?: boolean;
  chatId: string;
  attachments: Attachment[];
  onAttach: (file: Attachment) => void;
  onRemove: (id: string) => void;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);

  /*
   * Grow to three lines, then scroll.
   *
   * A prompt is usually one line and occasionally a paragraph; past three
   * lines the composer starts eating the conversation it belongs to, which is
   * the thing you are actually reading.
   */
  useEffect(() => {
    const node = field.current;
    if (!node) return;
    node.style.height = 'auto';
    const line = Number.parseFloat(getComputedStyle(node).lineHeight) || 22;
    node.style.height = `${Math.min(node.scrollHeight, line * 3)}px`;
  }, [value]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      const key = `${file.name}-${crypto.randomUUID()}`;
      setPending((rows) => [...rows, { key, name: file.name }]);

      try {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch(`/api/chat/${chatId}/files`, { method: 'POST', body });

        if (!response.ok) {
          const detail = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(detail.error ?? `Upload failed (${response.status})`);
        }

        onAttach((await response.json()) as Attachment);
        setPending((rows) => rows.filter((row) => row.key !== key));
      } catch (cause) {
        // Left in the list rather than dropped: a file that silently vanishes
        // reads as one that uploaded.
        setPending((rows) =>
          rows.map((row) =>
            row.key === key ? { ...row, error: (cause as Error).message } : row,
          ),
        );
      }
    }
  }

  const uploading = pending.some((row) => !row.error);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
      onPaste={(event) => {
        // Pasting a screenshot is how most images arrive.
        if (event.clipboardData.files.length) {
          event.preventDefault();
          void upload(event.clipboardData.files);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void upload(event.dataTransfer.files);
      }}
      /* Frosted rather than filled: in a chat it sits over the conversation,
         and an opaque panel there reads as the page ending. The blur is what
         makes the content behind it legible as "underneath" rather than
         "cut off".

         The fill is --color-card (#1a1a1a) at 55%, not the page black: at
         near-black the panel disappeared into the background and read as a
         hole rather than a surface. Legibility comes from the blur, so the
         grey can stay this light. */
      className="rounded-[22px] border border-white/10 bg-[#1a1a1a]/55 px-3 pb-2 pt-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-colors focus-within:border-white/20"
    >
      {(attachments.length > 0 || pending.length > 0) && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((file) => (
            <Chip
              key={file.id}
              name={file.name}
              detail={size(file.bytes)}
              onRemove={() => onRemove(file.id)}
            />
          ))}
          {pending.map((row) => (
            <Chip
              key={row.key}
              name={row.name}
              detail={row.error ?? 'Uploading…'}
              failed={Boolean(row.error)}
              onRemove={
                row.error
                  ? () => setPending((rows) => rows.filter((item) => item.key !== row.key))
                  : undefined
              }
            />
          ))}
        </div>
      )}

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
        className="scroll-area w-full resize-none bg-transparent px-2 text-[14px] leading-[22px] outline-none placeholder:text-[var(--color-dim)]"
      />

      <div className="mt-1 flex items-center justify-between">
        <input
          ref={picker}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            void upload(event.target.files);
            // Reset, or picking the same file twice in a row does nothing.
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          aria-label="Attach files"
          title="Attach files"
          className="nav-item flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M8 3.5v9M3.5 8h9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          type="submit"
          aria-label="Send"
          disabled={busy || uploading || !value.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-30"
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
      </div>
    </form>
  );
}

function Chip({
  name,
  detail,
  failed,
  onRemove,
}: {
  name: string;
  detail: string;
  failed?: boolean;
  onRemove?: () => void;
}) {
  return (
    <span className="flex max-w-[260px] items-center gap-2 rounded-lg bg-[var(--color-surface)] py-1.5 pl-2.5 pr-1.5 text-[12px]">
      <span className="truncate text-[var(--color-text)]">{name}</span>
      <span
        className="shrink-0"
        style={{ color: failed ? 'var(--status-failed)' : 'var(--color-dim)' }}
      >
        {detail}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="nav-item flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--color-dim)] hover:text-[var(--color-text)]"
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
