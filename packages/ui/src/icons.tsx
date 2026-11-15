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
 * The Sequel mark. Solid rather than stroked, and sized by the caller — it is a
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

export function UsersIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <circle cx="6" cy="5.25" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.9 13.25a4.1 4.1 0 0 1 8.2 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.6 3.2a2.4 2.4 0 0 1 0 4.1M11.8 9.6a4.1 4.1 0 0 1 2.3 3.65" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function KeyIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <circle cx="5.4" cy="5.4" r="3.1" stroke="currentColor" strokeWidth="1.3" />
      <path d="m7.7 7.7 5.6 5.6M11 11.4l1.3-1.3M9.4 9.8l1.3-1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function BuildingIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M2.75 13.5V3.4a1 1 0 0 1 .7-.95l5-1.4a1 1 0 0 1 1.3.95V13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.75 6.2h2.6a1 1 0 0 1 1 1v6.3M1.5 13.5h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.2 5.4h2M5.2 8h2M5.2 10.6h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <circle cx="8" cy="8" r="4.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M12.90 8.00L14.60 8.00M11.46 11.46L12.67 12.67M8.00 12.90L8.00 14.60M4.54 11.46L3.33 12.67M3.10 8.00L1.40 8.00M4.54 4.54L3.33 3.33M8.00 3.10L8.00 1.40M11.46 4.54L12.67 3.33"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Checklist, for Tasks — a run is a thing with a state, not a waveform. */
export function TasksIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="m1.9 4.3 1.3 1.3 2.4-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m1.9 11.3 1.3 1.3 2.4-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 4.4h5.9M8.2 11.4h5.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}


/**
 * MCP's mark — the official octicon, filled rather than stroked.
 *
 * It carries its own 24 viewBox because the path is drawn on that grid, and it
 * uses `fill="currentColor"` so it still takes the nav colour like the rest of
 * the set. My earlier approximations were a pen and then a set of arcs; this
 * is the real thing.
 */
export function McpIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} aria-hidden>
      <path
        fill="currentColor"
        d="M9.795 1.694a4.287 4.287 0 0 1 6.061 0a4.28 4.28 0 0 1 1.181 3.819a4.28 4.28 0 0 1 3.819 1.181a4.287 4.287 0 0 1 0 6.061l-6.793 6.793a.25.25 0 0 0 0 .353l2.617 2.618a.75.75 0 1 1-1.061 1.061l-2.617-2.618a1.75 1.75 0 0 1 0-2.475l6.793-6.793a2.785 2.785 0 1 0-3.939-3.939l-5.9 5.9a.7.7 0 0 1-.249.165a.749.749 0 0 1-.812-1.225l5.9-5.901a2.785 2.785 0 1 0-3.939-3.939L2.931 10.68A.75.75 0 1 1 1.87 9.619z"
      />
      <path
        fill="currentColor"
        d="M12.42 4.069a.75.75 0 0 1 1.061 0a.75.75 0 0 1 0 1.061L7.33 11.28a2.79 2.79 0 0 0 0 3.94a2.79 2.79 0 0 0 3.94 0l6.15-6.151a.75.75 0 0 1 1.061 0a.75.75 0 0 1 0 1.061l-6.151 6.15a4.285 4.285 0 1 1-6.06-6.06z"
      />
    </svg>
  );
}

export function MoreIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={`${base} ${className}`} aria-hidden>
      <circle cx="8" cy="3.4" r="1.3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="8" cy="12.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function ChartIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="M2 13.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.2 13.5V9.2M8 13.5V4.1M11.8 13.5V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CardIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <rect x="1.6" y="3.4" width="12.8" height="9.2" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.6 6.8h12.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.2 10.2h2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="m6.2 3.8 4.2 4.2-4.2 4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <rect x="2" y="3.4" width="12" height="10.6" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.6h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.4 1.9v2.6M10.6 1.9v2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden>
      <path d="m4.4 6.4 3.6 3.6 3.6-3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
