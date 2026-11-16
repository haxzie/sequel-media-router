'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Everything is stored in 0..1 image space, never pixels.
 *
 * The canvas is whatever size the image happens to be displayed at, and the
 * export is at the file's natural resolution — often 1024 against a 500px
 * preview. Normalised coordinates are what let the same op list draw
 * correctly at both.
 */
export type Op =
  | { kind: 'pen'; color: string; width: number; points: Array<[number, number]> }
  | { kind: 'mask'; width: number; points: Array<[number, number]> }
  | { kind: 'rect'; color: string; x: number; y: number; w: number; h: number }
  | { kind: 'text'; color: string; x: number; y: number; text: string };

export type DrawMode = 'select' | 'pen' | 'mask' | 'rect' | 'text';

/** Erase highlight: the same cornflower wash as the reference. */
const MASK_FILL = 'rgba(125, 175, 235, 0.55)';

function paint(
  ctx: CanvasRenderingContext2D,
  ops: Op[],
  w: number,
  h: number,
  scale: number,
) {
  for (const op of ops) {
    if (op.kind === 'pen' || op.kind === 'mask') {
      if (op.points.length === 0) continue;
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = op.width * scale;
      ctx.strokeStyle = op.kind === 'mask' ? MASK_FILL : op.color;
      const [first, ...rest] = op.points;
      ctx.moveTo(first![0] * w, first![1] * h);
      for (const [x, y] of rest) ctx.lineTo(x * w, y * h);
      ctx.stroke();
      continue;
    }

    if (op.kind === 'rect') {
      ctx.lineWidth = 3 * scale;
      ctx.strokeStyle = op.color;
      ctx.strokeRect(op.x * w, op.y * h, op.w * w, op.h * h);
      continue;
    }

    ctx.fillStyle = op.color;
    ctx.font = `${Math.round(22 * scale)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(op.text, op.x * w, op.y * h);
  }
}

/**
 * Flatten the image and its annotations into a PNG at natural resolution.
 *
 * Exported separately from the component because it runs at submit time, on
 * a detached canvas, at a different size from the one on screen.
 */
export async function flatten(url: string, ops: Op[]): Promise<string> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2D context.');

  ctx.drawImage(image, 0, 0);
  // Stroke widths are authored against a 1000px-wide reference so they stay
  // visually constant whatever the image's real size is.
  paint(ctx, ops, canvas.width, canvas.height, canvas.width / 1000);
  return canvas.toDataURL('image/png');
}

export function AnnotationCanvas({
  mode,
  color,
  ops,
  onCommit,
}: {
  mode: DrawMode;
  color: string;
  ops: Op[];
  onCommit: (op: Op) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Text is committed from the input, never dragged, so a draft is only ever
  // one of the three shapes you can drag out.
  const [draft, setDraft] = useState<Exclude<Op, { kind: 'text' }> | null>(null);
  const [typing, setTyping] = useState<{ x: number; y: number; value: string } | null>(null);
  const drawing = useRef(false);

  // Match the backing store to the displayed box, including on resize.
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const fit = () => {
      const box = node.getBoundingClientRect();
      node.width = Math.max(1, Math.round(box.width));
      node.height = Math.max(1, Math.round(box.height));
      const ctx = node.getContext('2d');
      if (ctx) paint(ctx, draft ? [...ops, draft] : ops, node.width, node.height, node.width / 1000);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ops, draft]);

  function at(event: React.PointerEvent): [number, number] {
    const box = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height];
  }

  function down(event: React.PointerEvent) {
    if (mode === 'select') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = at(event);

    if (mode === 'text') {
      setTyping({ x: point[0], y: point[1], value: '' });
      return;
    }

    drawing.current = true;
    setDraft(
      mode === 'rect'
        ? { kind: 'rect', color, x: point[0], y: point[1], w: 0, h: 0 }
        : mode === 'mask'
          ? { kind: 'mask', width: 40, points: [point] }
          : { kind: 'pen', color, width: 4, points: [point] },
    );
  }

  function move(event: React.PointerEvent) {
    if (!drawing.current || !draft) return;
    const [x, y] = at(event);
    setDraft(
      draft.kind === 'rect'
        ? { ...draft, w: x - draft.x, h: y - draft.y }
        : { ...draft, points: [...draft.points, [x, y] as [number, number]] },
    );
  }

  function up() {
    drawing.current = false;
    if (!draft) return;
    // A tap with no drag leaves nothing to show; do not record it.
    const empty =
      draft.kind === 'rect'
        ? Math.abs(draft.w) < 0.01 || Math.abs(draft.h) < 0.01
        : draft.points.length < 2;
    if (!empty) onCommit(draft);
    setDraft(null);
  }

  return (
    <>
      <canvas
        ref={canvas}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ cursor: mode === 'select' ? 'default' : 'crosshair' }}
      />

      {typing && (
        <input
          autoFocus
          value={typing.value}
          placeholder="Type, then Enter"
          onChange={(event) => setTyping({ ...typing, value: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setTyping(null);
            if (event.key !== 'Enter') return;
            if (typing.value.trim()) {
              onCommit({ kind: 'text', color, x: typing.x, y: typing.y, text: typing.value.trim() });
            }
            setTyping(null);
          }}
          onBlur={() => setTyping(null)}
          className="absolute z-10 rounded-lg border border-white/25 bg-black/70 px-2 py-1 text-[14px] text-white outline-none"
          style={{ left: `${typing.x * 100}%`, top: `${typing.y * 100}%` }}
        />
      )}
    </>
  );
}
