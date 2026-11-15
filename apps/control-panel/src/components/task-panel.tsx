'use client';

import { useEffect, useState } from 'react';
import { formatUsd } from '@sequel/core/pricing';
import { CloseIcon, DownloadIcon, ExternalIcon } from '@sequel/ui';
import { StatusDot } from '@sequel/ui';

export interface TaskSummary {
  task_id: string;
  model: string;
  modality: 'image' | 'video' | 'audio';
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  label: string;
  result_url?: string;
  assets?: Array<{ url: string; mime: string; bytes?: number; text?: string }>;
  cost: { usd: string; estimated: boolean };
  error?: string;
  created_at: string;
  completed_at?: string;
}

interface TaskDetail extends TaskSummary {
  input?: Record<string, unknown>;
}

const STATUS_COLOR: Record<TaskSummary['status'], string> = {
  queued: '#6b6b6b',
  in_progress: 'var(--color-sky)',
  completed: 'var(--color-mint)',
  failed: 'var(--color-pink)',
};

const STATUS_LABEL: Record<TaskSummary['status'], string> = {
  queued: 'Queued',
  in_progress: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

function size(bytes?: number): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Wall-clock time the provider actually took, where both ends are known. */
function duration(task: TaskSummary): string | null {
  if (!task.completed_at) return null;
  const ms = Date.parse(task.completed_at) - Date.parse(task.created_at);
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)}s`;
}

function stamp(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <div className="shrink-0 text-[12px] text-[var(--color-dim)]">{label}</div>
      <div className="min-w-0 text-right text-[13px] text-[var(--color-text)]">{children}</div>
    </div>
  );
}

function Preview({ task }: { task: TaskDetail }) {
  const asset = task.assets?.[0];
  const url = asset?.url ?? task.result_url;

  if (!url) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-[var(--color-card)] text-[13px] text-[var(--color-dim)]">
        {task.status === 'failed' ? 'No output' : 'Waiting for output…'}
      </div>
    );
  }

  if (task.modality === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={task.label}
        className="w-full rounded-2xl bg-[var(--color-card)] object-contain"
      />
    );
  }

  if (task.modality === 'video') {
    return (
      <video
        src={url}
        controls
        playsInline
        className="w-full rounded-2xl bg-black"
        // Posters come from the first frame; letting the browser fetch metadata
        // gives us a thumbnail without storing one.
        preload="metadata"
      />
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--color-card)] px-4 py-5">
      <audio src={url} controls className="w-full" preload="metadata" />
      {asset?.text && (
        <p className="scroll-area mt-4 max-h-40 overflow-y-auto text-[13px] leading-relaxed text-[var(--color-muted)]">
          {asset.text}
        </p>
      )}
    </div>
  );
}

export function TaskPanel({ task, onClose }: { task: TaskSummary; onClose: () => void }) {
  const [input, setInput] = useState<Record<string, unknown> | undefined>();
  const [promptOpen, setPromptOpen] = useState(false);

  // The list payload carries everything the panel shows except the input, which
  // is omitted there to keep the MCP response lean. Keyed on the id alone: the
  // list repolls every few seconds and refetching this on each new object
  // identity would be pure waste.
  useEffect(() => {
    let live = true;
    setInput(undefined);
    setPromptOpen(false);
    fetch(`/api/tasks/${task.task_id}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ task?: { input?: Record<string, unknown> } }>) : null))
      .then((data) => {
        if (live) setInput(data?.task?.input);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [task.task_id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The polled row is always the fresher copy, so it is the base.
  const detail: TaskDetail = { ...task, input };

  const asset = detail.assets?.[0];
  const url = asset?.url ?? detail.result_url;
  const took = duration(detail);
  const prompt = typeof detail.input?.prompt === 'string' ? detail.input.prompt : detail.label;

  return (
    <>
      {/*
        No scrim, deliberately. A click-away overlay swallowed clicks on the
        table behind, so switching between two results meant closing the panel
        first. Escape and the X close it; rows stay live underneath.
      */}
      <aside className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col border-l border-[var(--color-line)] bg-[var(--color-surface)]">
        <header className="flex items-center justify-between gap-3 px-5 py-4">
          <StatusDot color={STATUS_COLOR[detail.status]}>
            <span className="text-[13px] text-[var(--color-muted)]">
              {STATUS_LABEL[detail.status]}
            </span>
          </StatusDot>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <Preview task={detail} />

          {/*
            Prompts run long — a character sheet's is a paragraph. Clamped so
            the cost and timing rows stay above the fold; click to read it all.
          */}
          <button
            type="button"
            onClick={() => setPromptOpen((open) => !open)}
            className={[
              // No `block` here: it overrides the `display:-webkit-box` that
              // line-clamp needs, and the clamp silently stops working.
              'mt-5 w-full text-left text-[14px] leading-snug text-[var(--color-text)]',
              promptOpen ? '' : 'line-clamp-3',
            ].join(' ')}
          >
            {prompt}
          </button>

          {detail.error && (
            <p className="mt-3 rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[12px] leading-relaxed text-[var(--color-pink)]">
              {detail.error}
            </p>
          )}

          <div className="mt-4 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
            <Row label="Model">
              <code className="font-mono text-[11px] text-[var(--color-muted)]">
                {detail.model}
              </code>
            </Row>
            <Row label="Type">
              <span className="capitalize text-[var(--color-muted)]">{detail.modality}</span>
            </Row>
            <Row label="Cost">
              <span className="nums">{formatUsd(detail.cost.usd)}</span>
              {detail.cost.estimated && (
                <span className="ml-1.5 text-[11px] text-[var(--color-dim)]">est</span>
              )}
            </Row>
            {took && (
              <Row label="Took">
                <span className="nums text-[var(--color-muted)]">{took}</span>
              </Row>
            )}
            <Row label="Started">
              <span className="text-[var(--color-muted)]">{stamp(detail.created_at)}</span>
            </Row>
            {detail.completed_at && (
              <Row label="Finished">
                <span className="text-[var(--color-muted)]">{stamp(detail.completed_at)}</span>
              </Row>
            )}
            {asset?.mime && (
              <Row label="Format">
                <span className="text-[var(--color-muted)]">
                  {asset.mime}
                  {size(asset.bytes) ? ` · ${size(asset.bytes)}` : ''}
                </span>
              </Row>
            )}
            <Row label="Task">
              <code className="font-mono text-[11px] text-[var(--color-dim)]">
                {detail.task_id}
              </code>
            </Row>
          </div>

          {detail.input && Object.keys(detail.input).length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer list-none text-[12px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-muted)]">
                Input parameters
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-[var(--color-card)] px-3.5 py-3 font-mono text-[11px] leading-relaxed text-[var(--color-muted)]">
                {JSON.stringify(detail.input, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {url && (
          <footer className="flex items-center gap-2 border-t border-[var(--color-line)] px-5 py-4">
            <a
              href={url}
              download
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              <DownloadIcon />
              Download
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
            >
              Open
              <ExternalIcon className="h-3.5 w-3.5" />
            </a>
          </footer>
        )}
      </aside>
    </>
  );
}
