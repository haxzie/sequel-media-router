'use client';

import { formatUsd } from '@sequel/core/pricing';

/**
 * What a run_models call looks like while it is happening, and after.
 *
 * The placeholder is sized from the aspect ratio in the tool input where there
 * is one, so the image does not shove the page around when it lands. That is
 * the whole reason to read the input rather than show a generic box.
 */
export interface RunResult {
  task_id?: string;
  status?: string;
  result_url?: string;
  assets?: Array<{ url: string; mime: string; text?: string }>;
  cost?: { usd: string; estimated: boolean };
  eta_seconds?: number;
  error?: string;
}

const RATIO: Record<string, string> = {
  '1:1': '1 / 1',
  '16:9': '16 / 9',
  '9:16': '9 / 16',
  '4:3': '4 / 3',
  '3:4': '3 / 4',
};

function aspect(input: Record<string, unknown> | undefined): string {
  const ratio = typeof input?.ratio === 'string' ? input.ratio : undefined;
  const size = typeof input?.size === 'string' ? input.size : undefined;
  if (ratio && RATIO[ratio]) return RATIO[ratio]!;
  if (size && /^\d+x\d+$/.test(size)) return size.replace('x', ' / ');
  return '1 / 1';
}

export function GenerationPending({
  input,
}: {
  input: Record<string, unknown> | undefined;
}) {
  const model = typeof input?.model === 'string' ? input.model : 'a model';
  const prompt =
    typeof (input?.input as Record<string, unknown> | undefined)?.prompt === 'string'
      ? ((input!.input as Record<string, unknown>).prompt as string)
      : null;

  return (
    <div className="mt-2 max-w-[360px]">
      <div
        className="sheen w-full rounded-xl border border-[var(--color-line)]"
        style={{ aspectRatio: aspect(input?.input as Record<string, unknown>) }}
      />
      <div className="mt-2 text-[12px] text-[var(--color-dim)]">
        Generating with <code className="font-mono">{model}</code>
        {prompt && <span className="block truncate">{prompt}</span>}
      </div>
    </div>
  );
}

export function GenerationResult({ result }: { result: RunResult }) {
  if (result.error) {
    return (
      <div className="mt-2 rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] text-[var(--color-pink)]">
        {result.error}
      </div>
    );
  }

  const asset = result.assets?.[0];
  const url = asset?.url ?? result.result_url;

  // Video returns in_progress with no asset — say where it went rather than
  // rendering an empty frame.
  if (!url) {
    return (
      <div className="mt-2 max-w-[360px]">
        <div
          className="sheen w-full rounded-xl border border-[var(--color-line)]"
          style={{ aspectRatio: '16 / 9' }}
        />
        <div className="mt-2 text-[12px] text-[var(--color-dim)]">
          {result.status === 'in_progress'
            ? `Running${result.eta_seconds ? ` · about ${result.eta_seconds}s` : ''} — it will appear in Tasks.`
            : 'No output returned.'}
        </div>
      </div>
    );
  }

  const isVideo = asset?.mime?.startsWith('video/');
  const isAudio = asset?.mime?.startsWith('audio/');

  return (
    <div className="mt-2 max-w-[360px]">
      {isVideo ? (
        <video src={url} controls playsInline preload="metadata" className="w-full rounded-xl bg-black" />
      ) : isAudio ? (
        <div className="rounded-xl bg-[var(--color-card)] px-4 py-4">
          <audio src={url} controls preload="metadata" className="w-full" />
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="" className="w-full rounded-xl bg-[var(--color-card)]" />
      )}

      <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--color-dim)]">
        {result.cost && (
          <span className="nums">
            {formatUsd(result.cost.usd)}
            {result.cost.estimated ? ' est' : ''}
          </span>
        )}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-[var(--color-text)]"
        >
          Open
        </a>
      </div>
    </div>
  );
}
