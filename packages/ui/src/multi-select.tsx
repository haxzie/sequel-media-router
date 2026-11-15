'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from './icons';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Pill-shaped multi-select, matching the single-value pills beside it.
 *
 * A popover with checkboxes rather than `<select multiple>`, which on every
 * platform is a scrolling box that requires modifier-clicks and cannot show a
 * count. The trade is that keyboard support is ours to provide: Escape closes,
 * and each option is a real button in tab order.
 */
export function MultiSelectPill({
  label,
  icon,
  options,
  selected,
  onChange,
  emptyText = 'Nothing to filter by.',
}: {
  label: string;
  icon?: ReactNode;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', away);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', away);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const active = selected.length > 0;

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={[
          'nav-item flex items-center gap-2 rounded-full py-2 pl-4 pr-3 text-[13px] transition-colors',
          active
            ? 'bg-white text-[#0a0a0a]'
            : 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-text)]',
        ].join(' ')}
      >
        {icon}
        {/* The count replaces the label rather than sitting beside it: the
            pill is narrow and "Models 3" reads as a model called 3. */}
        {active ? `${selected.length} selected` : label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 ${active ? 'text-[#0a0a0a]/50' : 'text-[var(--color-dim)]'}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[300px] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] shadow-xl">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[12px] text-[var(--color-dim)]">
            <span>{label}</span>
            {active && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="transition-colors hover:text-[var(--color-text)]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="scroll-area max-h-[320px] overflow-y-auto pb-1">
            {options.length === 0 ? (
              <div className="px-3.5 py-3 text-[13px] text-[var(--color-dim)]">{emptyText}</div>
            ) : (
              options.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
                  >
                    <span
                      className={[
                        'flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                        checked
                          ? 'border-white bg-white text-[#0a0a0a]'
                          : 'border-[var(--color-line-strong)]',
                      ].join(' ')}
                    >
                      {checked && <CheckIcon className="h-2.5 w-2.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px]">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="nums shrink-0 text-[11px] text-[var(--color-dim)]">
                        {option.count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
