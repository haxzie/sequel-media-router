'use client';

import type { ReactNode } from 'react';

/** The floating bar itself. Every mode renders its own controls into one. */
export function Bar({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-[#2b2b2b]/95 p-1.5 shadow-xl backdrop-blur">
      {/* The grip is in the reference and reads as 'this bar is a thing that
          floats'. It does not drag: a bar that moves would need somewhere to
          move to, and the viewer is one image on a backdrop. */}
      <span className="px-1.5 text-[var(--color-dim)]" aria-hidden>
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
          <circle cx="6" cy="4" r="1.1" />
          <circle cx="10" cy="4" r="1.1" />
          <circle cx="6" cy="8" r="1.1" />
          <circle cx="10" cy="8" r="1.1" />
          <circle cx="6" cy="12" r="1.1" />
          <circle cx="10" cy="12" r="1.1" />
        </svg>
      </span>
      {children}
    </div>
  );
}

export function Divider() {
  return <span className="mx-1 h-5 w-px bg-white/15" aria-hidden />;
}

export function Tool({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`nav-item flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] transition-colors disabled:opacity-30 ${
        active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

/** Icon-only, for the dense sub-toolbars. */
export function IconTool(props: Omit<Parameters<typeof Tool>[0], 'label'> & { label: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.active}
      className={`nav-item flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-30 ${
        props.active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className="flex h-[18px] w-[18px] items-center justify-center">{props.icon}</span>
    </button>
  );
}

export function SendButton({ label = 'Send', onClick, disabled }: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-[var(--color-blue,#3b82f6)] px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {label}
    </button>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const Icons = {
  markup: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M1.8 10.5c1.8 0 1.8-5 3.6-5s1.8 5 3.6 5 1.8-5 3.6-5c1 0 1.4 1.5 1.6 3" />
    </svg>
  ),
  comment: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M5.5 2.2H3.6c-.8 0-1.4.6-1.4 1.4v1.9M10.5 2.2h1.9c.8 0 1.4.6 1.4 1.4v1.9M2.2 10.1V12c0 .8.6 1.4 1.4 1.4h1.9" />
      <circle cx="11.6" cy="11.6" r="2.4" />
    </svg>
  ),
  removeBg: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2.6" />
      <path d="M2.6 9.8L6 6.4l3.2 3.2M9 8.6l1.6-1.6 2.8 2.8" />
    </svg>
  ),
  erase: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M8.6 2.6L2.6 8.6a1.4 1.4 0 0 0 0 2l2.8 2.8h4l4-4a1.4 1.4 0 0 0 0-2l-3.4-3.4a1.4 1.4 0 0 0-1.4-1.4z" />
    </svg>
  ),
  resize: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <rect x="2.2" y="4.2" width="11.6" height="7.6" rx="1.6" />
      <path d="M2.2 7h3.4v4.8" />
    </svg>
  ),
  cursor: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M3.4 2.4l9 4.4-4 1.2-1.2 4z" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M3.4 3.4h9.2M8 3.4v9.2" />
    </svg>
  ),
  shape: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <rect x="2.4" y="5.4" width="8.2" height="8.2" rx="1.4" />
      <path d="M5.4 5.4V3.8c0-.8.6-1.4 1.4-1.4h5.4c.8 0 1.4.6 1.4 1.4v5.4c0 .8-.6 1.4-1.4 1.4h-1.6" />
    </svg>
  ),
  rubber: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M6.6 13.4h6.8M9.8 3.2l3 3a1.3 1.3 0 0 1 0 1.9l-5 5H5.2l-2-2a1.3 1.3 0 0 1 0-1.9l4.7-4.7a1.3 1.3 0 0 1 1.9 0z" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M6 4.4L3 7.4l3 3" />
      <path d="M3 7.4h6.4a3.4 3.4 0 1 1 0 6.8H7.4" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M10 4.4l3 3-3 3" />
      <path d="M13 7.4H6.6a3.4 3.4 0 1 0 0 6.8h2" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 16 16" className="h-full w-full" {...stroke}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
};
