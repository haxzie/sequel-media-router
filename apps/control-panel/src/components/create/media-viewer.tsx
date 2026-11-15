'use client';

import { formatUsd } from '@sequel/core/pricing';
import { CloseIcon, DownloadIcon } from '@sequel/ui';
import { useEffect } from 'react';

export interface ViewerMedia {
  url: string;
  mime?: string;
  /** The run_models argument object: `{ model, input: { prompt, … } }`. */
  input?: Record<string, unknown>;
  cost?: { usd: string; estimated: boolean };
  taskId?: string;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/**
 * The generation, large, with what produced it beside it.
 *
 * Two columns rather than a caption underneath: a prompt is often several
 * lines, and stacking it below a full-height image puts the two things you
 * are comparing on different screens.
 */
export function MediaViewer({ media, onClose }: { media: ViewerMedia; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // The page behind must not scroll while this is open, or dismissing it
    // returns you somewhere else in the conversation.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const args = (media.input?.input as Record<string, unknown> | undefined) ?? {};
  const prompt = text(args.prompt);
  const negative = text(args.negative_prompt);
  const model = text(media.input?.model);
  const ratio = text(args.ratio) ?? text(args.size);
  const seed = typeof args.seed === 'number' ? String(args.seed) : null;

  const isVideo = media.mime?.startsWith('video/');
  const isAudio = media.mime?.startsWith('audio/');

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Generation"
      // Only a click that both starts and ends on the backdrop closes it, so
      // a text selection that drifts out of the panel does not dismiss.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex min-w-0 flex-1 items-center justify-center p-6">
        {isVideo ? (
          <video
            src={media.url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-xl bg-black"
          />
        ) : isAudio ? (
          <div className="w-full max-w-lg rounded-xl bg-[var(--color-card)] p-6">
            <audio src={media.url} controls autoPlay className="w-full" />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={media.url}
            alt={prompt ?? 'Generation'}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        )}
      </div>

      <aside className="flex w-[360px] shrink-0 flex-col border-l border-[var(--color-line)] bg-[var(--color-bg)]">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[13px] font-medium text-[var(--color-text)]">Generation</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="nav-item flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {prompt ? (
            <>
              <div className="text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
                Prompt
              </div>
              {/* Selectable and wrapped in full — this is the thing most
                  worth copying back out of the viewer. */}
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-text)]">
                {prompt}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-[var(--color-dim)]">No prompt recorded for this run.</p>
          )}

          {negative && (
            <>
              <div className="mt-5 text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
                Negative prompt
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-muted)]">
                {negative}
              </p>
            </>
          )}

          <dl className="mt-5 border-t border-[var(--color-line)]">
            {model && <Row label="Model">{model}</Row>}
            {ratio && <Row label="Size">{ratio}</Row>}
            {seed && <Row label="Seed">{seed}</Row>}
            {media.cost && (
              <Row label="Cost">
                <span className="nums">
                  {formatUsd(media.cost.usd)}
                  {media.cost.estimated ? ' est' : ''}
                </span>
              </Row>
            )}
            {media.taskId && <Row label="Task">{media.taskId}</Row>}
          </dl>

          <div className="mt-5 flex gap-2">
            <a
              href={media.url}
              download
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[13px] text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              <DownloadIcon />
              Download
            </a>
            <a
              href={media.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-xl border border-[var(--color-line)] px-3.5 py-2.5 text-[13px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-text)]"
            >
              Open
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] py-2.5">
      <dt className="shrink-0 text-[12px] text-[var(--color-dim)]">{label}</dt>
      <dd className="min-w-0 truncate text-right font-mono text-[12px] text-[var(--color-text)]">
        {children}
      </dd>
    </div>
  );
}
