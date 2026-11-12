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
