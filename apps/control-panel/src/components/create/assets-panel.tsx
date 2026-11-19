'use client';

import { useEffect, useState } from 'react';
import { MediaViewer, type ViewerMedia } from './media-viewer';

export interface ChatAsset {
  url: string;
  mime: string;
  taskId?: string;
  cost?: { usd: string; estimated: boolean };
  /** The run's input, so the viewer can show the prompt behind an asset. */
  input?: Record<string, unknown>;
}

/**
 * Everything this chat made, in one grid.
 *
 * A long conversation buries its own output: the image you want is four
 * scrolls up, between two tool traces. This is the same assets, addressed by
 * eye instead of by position.
 *
 * Derived from the messages rather than fetched — the chat already holds
 * every run's result, and a second source of truth could disagree with what
 * is on screen.
 *
 * It is a column in the page, not a drawer over it: the conversation gives
 * up the width while the panel is open. An overlay would cover the thing
 * you are comparing the assets against, which is the only reason to open
 * them side by side.
 */
export function AssetsPanel({
  assets,
  open,
  onClose,
}: {
  assets: ChatAsset[];
  open: boolean;
  onClose: () => void;
}) {
  const [viewing, setViewing] = useState<ViewerMedia | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      // Only when nothing is open on top of it, or Escape closes both.
      if (event.key === 'Escape' && !viewing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, viewing]);

  if (!open) return null;

  return (
    <>
      {/* Sticky and full height so it stays beside whatever part of the
          conversation you have scrolled to.

          The negative margins eat the dashboard's own padding on three
          sides. Without -mt-8 the panel starts 2rem down at scroll 0 — a
          sticky box sits at its natural position until the page moves — so
          its header hung below the breadcrumb instead of meeting the top of
          the screen. */}
      <aside
        aria-label="Assets"
        className="sticky top-0 -mr-10 -mt-8 flex h-screen w-[320px] shrink-0 flex-col border-l border-[var(--color-line)] bg-[var(--color-surface)] xl:w-[380px]"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3.5">
          <span className="text-[14px] text-[var(--color-text)]">
            Assets
            <span className="nums ml-2 text-[12.5px] text-[var(--color-dim)]">{assets.length}</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close assets"
            className="nav-item flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="m4 4 8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto p-4">
          {assets.length === 0 ? (
            <p className="px-1 py-10 text-center text-[13px] text-[var(--color-muted)]">
              Nothing generated in this chat yet. Anything you make here collects in this panel.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {assets.map((asset, index) => (
                <button
                  key={`${asset.url}-${index}`}
                  type="button"
                  onClick={() =>
                    setViewing({
                      url: asset.url,
                      mime: asset.mime,
                      input: asset.input,
                      cost: asset.cost,
                      taskId: asset.taskId,
                    })
                  }
                  className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] transition-colors hover:border-[var(--color-line-strong)]"
                >
                  <Thumb asset={asset} />
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {viewing && <MediaViewer media={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

/**
 * Audio has no frame to show, and a video poster costs a download of the
 * whole file, so both get a label rather than a picture.
 */
function Thumb({ asset }: { asset: ChatAsset }) {
  if (asset.mime.startsWith('image/')) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={asset.url} alt="" className="h-full w-full object-cover" />;
  }

  if (asset.mime.startsWith('video/')) {
    return (
      <video
        src={asset.url}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-full w-full items-center justify-center text-[12px] text-[var(--color-muted)]">
      ♪ audio
    </span>
  );
}
