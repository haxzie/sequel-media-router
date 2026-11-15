'use client';

import { CheckIcon } from '@sequel/ui';
import { useEffect, useRef, useState } from 'react';
import { capabilityLabel } from './capability-pills';

/**
 * Capability filter.
 *
 * Search ranks models by similarity, which means a query like "video with
 * sound" can still put a silent model first — the capability is a string in a
 * blob of prose, so it only nudges the score. This turns the same idea into a
 * constraint: selected capabilities are ANDed, and anything missing one is
 * gone rather than merely ranked lower.
 */
export function CapabilityFilter({
  available,
  selected,
  onChange,
}: {
  available: Array<{ value: string; count: number }>;
  selected: string[];
  onChange: (next: string[]) => void;
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
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  }

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={[
          'nav-item flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors',
          selected.length > 0
            ? 'bg-white text-[#0a0a0a]'
            : 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-text)]',
        ].join(' ')}
      >
        <FilterGlyph />
        Filter
        {selected.length > 0 && (
          <span className="nums rounded-full bg-[#0a0a0a]/10 px-1.5 text-[11px] font-medium">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[260px] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] shadow-xl">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[12px] text-[var(--color-dim)]">
            <span>Has all of</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="transition-colors hover:text-[var(--color-text)]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="scroll-area max-h-[300px] overflow-y-auto pb-1">
            {available.length === 0 ? (
              <div className="px-3.5 py-3 text-[13px] text-[var(--color-dim)]">
                Nothing to filter by here.
              </div>
            ) : (
              available.map((capability) => {
                const active = selected.includes(capability.value);
                return (
                  <button
                    key={capability.value}
                    type="button"
                    onClick={() => toggle(capability.value)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
                  >
                    <span
                      className={[
                        'flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                        active
                          ? 'border-white bg-white text-[#0a0a0a]'
                          : 'border-[var(--color-line-strong)]',
                      ].join(' ')}
                    >
                      {active && <CheckIcon className="h-2.5 w-2.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {capabilityLabel(capability.value)}
                    </span>
                    <span className="nums shrink-0 text-[11px] text-[var(--color-dim)]">
                      {capability.count}
                    </span>
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

function FilterGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path
        d="M2.5 4h11L9.3 8.8v3.6l-2.6 1.3V8.8z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
