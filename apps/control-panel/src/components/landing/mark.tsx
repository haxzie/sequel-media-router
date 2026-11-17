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
 * Same three concentric arcs, same 11:7:3 radii, but drawn as strokes and
 * entered from the top so they sweep out to the right of the headline. It is
 * set low enough to be a texture rather than a second logo — if a reader
 * notices it as a logo, it is too strong.
 */
export function Arcs({ className = '' }: { className?: string }) {
  /* The mark's gaps are even, and so are these. They are closer together
     than the mark's, because at this size the innermost ring of a 11:7:3 set
     falls off the bottom of the frame and only two arcs ever show. */
  const radii = [400, 300, 200];

  return (
    <svg
      viewBox="0 0 420 420"
      fill="none"
      aria-hidden
      className={className}
      /* The arcs run past the bottom of whatever box clips them, and a
         quarter circle cut flat across reads as a mistake. Fading them out
         instead lets them leave the frame rather than stop in it. */
      style={{
        maskImage: 'linear-gradient(to bottom, #000 45%, transparent 92%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent 92%)',
      }}
    >
      {radii.map((r) => (
        <path
          key={r}
          d={`M20 ${420 - r}A${r} ${r} 0 0 1 ${20 + r} 420`}
          stroke="currentColor"
          strokeWidth="16"
        />
      ))}
    </svg>
  );
}
