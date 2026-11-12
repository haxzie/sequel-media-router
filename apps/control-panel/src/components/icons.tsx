/** 16px stroke icons, matching the reference's weight. */
type IconProps = { className?: string };

const base = 'h-4 w-4 shrink-0';

export function HomeIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M2.5 6.5 8 2l5.5 4.5V13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.25 14V9.25h3.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function LayersIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M8 1.75 14.25 5 8 8.25 1.75 5 8 1.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="m2.75 8 5.25 2.75L13.25 8M2.75 11l5.25 2.75L13.25 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ActivityIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M1.75 8h2.5l1.75-4.5 3 9L10.75 8h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <circle cx="7.25" cy="7.25" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="m10.75 10.75 2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function CopyIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <rect x="5.75" y="5.75" width="8.5" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.25 3.75A2 2 0 0 0 8.25 1.75h-4.5a2 2 0 0 0-2 2v4.5a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="m3.5 8.5 3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ExternalIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M6.5 3.25H3.75a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.75 1.75h4.5v4.5M14 2 7.75 8.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The Forge mark. Solid rather than stroked, and sized by the caller — it is a
 * logo, not part of the 16px nav icon set.
 */
export function AnvilIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden>
      <path
        fill="currentColor"
        d="M9 5v5c4.03 2.47-.56 4.97-3 6v3h15v-3c-6.41-2.73-3.53-7 1-8V5zM2 6c.81 2.13 2.42 3.5 5 4V6z"
      />
    </svg>
  );
}

export function CloseIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function DownloadIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M8 2v8m0 0 3-3m-3 3L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.75 11.5V13a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1v-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Tiny modality glyphs for capability pills. 12px, drawn inside the pill, so
 * `text › image` reads as a transform rather than as two words.
 */
const glyph = 'h-3 w-3 shrink-0';

export function TextGlyph({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={`${glyph} ${className}`} aria-hidden>
      <path d="M2 3h8M2 6h8M2 9h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ImageGlyph({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={`${glyph} ${className}`} aria-hidden>
      <rect x="1.6" y="2.2" width="8.8" height="7.6" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="m2.4 8.4 2.3-2.3 1.7 1.7 1.3-1.3 1.9 1.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VideoGlyph({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={`${glyph} ${className}`} aria-hidden>
      <rect x="1" y="3" width="6.6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="m8.4 5.4 2.2-1.5v4.2L8.4 6.6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

export function AudioGlyph({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={`${glyph} ${className}`} aria-hidden>
      <path d="M4.6 8.4V2.8l5-1v5.2" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="3.3" cy="8.6" r="1.4" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="8.3" cy="7.4" r="1.4" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function ArrowGlyph({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 8 12" fill="none" className={`h-3 w-2 shrink-0 ${className}`} aria-hidden>
      <path d="m2.8 4 2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
