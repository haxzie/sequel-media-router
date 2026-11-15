'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MoreIcon } from './icons';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  /** Renders in the warning tone and sits below a divider. */
  destructive?: boolean;
}

/**
 * Three-dot menu for row actions.
 *
 * Row actions were bare text buttons, which meant every row advertised
 * "Revoke" at rest — the most destructive thing available, always one
 * mis-click away. Behind a menu they cost one deliberate click first.
 */
export function RowMenu({ items, label = 'Actions' }: { items: MenuItem[]; label?: string }) {
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

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="nav-item rounded-lg p-1.5 text-[var(--color-dim)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
      >
        <MoreIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-[180px] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] py-1 shadow-xl">
          {items.map((item, index) => (
            <MenuRow key={item.label} item={item} divided={item.destructive && index > 0} close={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuRow({
  item,
  divided,
  close,
}: {
  item: MenuItem;
  divided?: boolean;
  close: () => void;
}): ReactNode {
  return (
    <>
      {divided && <div className="my-1 h-px bg-[var(--color-line)]" />}
      <button
        type="button"
        onClick={() => {
          close();
          item.onSelect();
        }}
        className={[
          'block w-full px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-[var(--color-card-hover)]',
          item.destructive
            ? 'text-[var(--color-pink)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
        ].join(' ')}
      >
        {item.label}
      </button>
    </>
  );
}
