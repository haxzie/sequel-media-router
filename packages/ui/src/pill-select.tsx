'use client';

import type { ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from './icons';

/**
 * A select shaped like the filter pills beside it.
 *
 * Still a native `<select>` underneath — keyboard, type-ahead and the
 * platform's own picker on touch are worth more than a custom listbox that
 * reimplements them badly. The chrome is painted around it: the browser's
 * arrow is removed and ours drawn in, so the control matches the rest of the
 * row rather than the operating system.
 */
export function PillSelect({
  icon,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode }) {
  return (
    <div className="relative inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] py-2 pl-4 pr-3 text-[var(--color-muted)] transition-colors focus-within:text-[var(--color-text)] hover:text-[var(--color-text)]">
      {icon && <span className="pointer-events-none shrink-0">{icon}</span>}

      <select
        {...props}
        className={`nav-item max-w-[180px] cursor-pointer appearance-none truncate bg-transparent pr-5 text-[13px] text-current outline-none ${className}`}
      >
        {children}
      </select>

      {/* Ours, not the platform's — the native arrow cannot be styled. */}
      <ChevronDownIcon className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[var(--color-dim)]" />
    </div>
  );
}
