/**
 * The Sequel mark: three concentric arcs.
 *
 * Inlined rather than an <img> so it inherits currentColor and sits on the
 * text baseline wherever the wordmark goes — a file would need a separate
 * colour decision at every size.
 */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 4c6.075 0 11 4.925 11 11v5h-2v-5a9 9 0 0 0-8.735-8.996L12 6a9 9 0 0 0-8.996 8.735L3 15v5H1v-5C1 8.925 5.925 4 12 4m0 4a7 7 0 0 1 7 7v5h-2v-5a5 5 0 0 0-4.783-4.995L12 10a5 5 0 0 0-4.995 4.783L7 15v5H5v-5a7 7 0 0 1 7-7m0 4a3 3 0 0 1 3 3v5h-2v-5a1 1 0 0 0-.883-.993L12 14a1 1 0 0 0-.993.883L11 15v5H9v-5a3 3 0 0 1 3-3" />
    </svg>
  );
}

/** Mark plus name, as the header and footer use it. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <Mark className="h-[18px] w-[18px]" />
      <span className="text-[15px] font-medium tracking-tight">Sequel</span>
    </span>
  );
}

/**
 * The mark again, at the size of the page rather than the size of a word.
 *
 * Three concentric quarter-arcs sharing a centre at the top right corner, so
 * each one drops in vertically from the top edge and leaves horizontally
 * through the right edge — the same curve as the mark's shoulder, drawn long
 * enough that only one quarter of it is ever on screen.
 *
 * Even gaps, as the mark has. Set low enough to be texture: if a reader
 * notices it as a logo, it is too strong.
 */
export function Arcs({ className = '' }: { className?: string }) {
  /* Three, evenly spaced, as the mark has — and struck at the mark's own
     proportion, where the band and the gap between bands are the same width
     (2 and 2, in its 24-unit box). At 7% opacity a hairline would disappear
     into the background; at this weight the three read as one band sweeping
     past the corner. */
  const radii = [100, 89, 78];

  return (
    /* overflow-visible, because the outermost arc starts on x=0 and an SVG
       clips to its viewBox by default — which sliced that band in half down
       its length at the top left. */
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={`overflow-visible ${className}`}
    >
      {radii.map((r) => (
        <path
          key={r}
          d={`M${100 - r} 0A${r} ${r} 0 0 0 100 ${r}`}
          stroke="currentColor"
          strokeWidth="5.5"
        />
      ))}
    </svg>
  );
}
