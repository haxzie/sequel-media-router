'use client';

import { formatUsd } from '@sequel/core/pricing';
import { useState } from 'react';
import { MediaViewer } from './media-viewer';

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

/**
 * The dot field.
 *
 * No props and no children: density, dot size and the wave all live in CSS
 * now, because the field is a masked gradient rather than a grid of nodes.
 */
function DotWave() {
  return <div className="dot-wave" />;
}

/**
 * The box every state of a generation lives in.
 *
 * One component rather than matching classes in two places: the placeholder
 * and the finished image have to agree on size exactly, and the moment they
 * are written separately they drift and the image jumps when it lands.
 */
function Frame({ ratio, children }: { ratio: string; children: React.ReactNode }) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)]"
      style={{ aspectRatio: ratio }}
    >
      {children}
    </div>
  );
}

export function GenerationPending({
  input,
  inGrid,
}: {
  input: Record<string, unknown> | undefined;
  /** Inside a batch grid: the cell sets the width, so drop the cap. */
  inGrid?: boolean;
}) {
  /*
   * No caption. It used to name the model and echo the prompt, which the
   * trace above now says better — and because the finished image carries no
   * caption either, those two lines were a step change in height at the
   * exact moment the image appeared.
   */
  return (
    <div className={inGrid ? '' : 'mt-2 max-w-[360px]'}>
      <Frame ratio={aspect(input?.input as Record<string, unknown>)}>
        <DotWave />
      </Frame>
    </div>
  );
}

export function GenerationResult({
  result,
  input,
  inGrid,
}: {
  result: RunResult;
  /** The run_models arguments, so the viewer can show what produced this. */
  input?: Record<string, unknown>;
  /** Inside a batch grid: the cell sets the width, so drop the cap. */
  inGrid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (result.error) {
    return (
      <div
        className={`rounded-xl bg-[var(--color-card)] px-3.5 py-3 text-[13px] text-[var(--color-pink)] ${
          inGrid ? '' : 'mt-2'
        }`}
      >
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
      <div className={inGrid ? '' : 'mt-2 max-w-[360px]'}>
        <Frame ratio="16 / 9">
          <DotWave />
        </Frame>
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
  // The same ratio the placeholder reserved, so the frame does not resize
  // underneath the image as it decodes.
  const ratio = aspect(input?.input as Record<string, unknown>);

  return (
    <div className={inGrid ? '' : 'mt-2 max-w-[360px]'}>
      {isVideo ? (
        /*
         * Video and audio keep their own controls and are opened from the
         * caption instead — a click on a player is a click on play, and
         * hijacking it to open a dialog would break the obvious thing.
         */
        <Frame ratio={ratio}>
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          />
        </Frame>
      ) : isAudio ? (
        <div className="rounded-xl bg-[var(--color-card)] px-4 py-4">
          <audio src={url} controls preload="metadata" className="w-full" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open generation"
          className="block w-full cursor-zoom-in transition-opacity hover:opacity-90"
        >
          <Frame ratio={ratio}>
            {/*
              * contain, not cover: the ratio is what we asked the model for
              * rather than what it returned, and the two can disagree —
              * letterboxing against the card is honest where silently
              * cropping someone's generation is not.
              */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-contain" />
          </Frame>
        </button>
      )}

      {open && (
        <MediaViewer
          media={{
            url,
            mime: asset?.mime,
            input,
            cost: result.cost,
            taskId: result.task_id,
          }}
          onClose={() => setOpen(false)}
        />
      )}

      {/*
        * Only under a player.
        *
        * An image is the thing itself — it opens on click and its cost and
        * model are in the viewer, so a line of grey text under every one is
        * clutter, and under a grid of six it is six times the clutter. A
        * video or audio player cannot be clicked to open, since a click
        * there means play, so it keeps the link.
        */}
      {(isVideo || isAudio) && (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--color-dim)]">
          {result.cost && (
            <span className="nums">
              {formatUsd(result.cost.usd)}
              {result.cost.estimated ? ' est' : ''}
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="transition-colors hover:text-[var(--color-text)]"
          >
            Open
          </button>
        </div>
      )}
    </div>
  );
}
