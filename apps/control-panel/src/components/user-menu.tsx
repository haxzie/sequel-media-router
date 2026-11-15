'use client';

import { Avatar } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import type { SidebarUser } from './sidebar';

export function UserMenu({ user }: { user: SidebarUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-[var(--color-card)]"
      >
        <Avatar name={user.name} src={user.image} size={28} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] text-[var(--color-text)]">{user.name}</div>
          <div className="truncate text-[11px] text-[var(--color-dim)]">{user.email}</div>
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-1 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] py-1 shadow-xl">
          <button
            type="button"
            onClick={() =>
              void authClient.signOut().then(() => {
                router.replace('/login');
                router.refresh();
              })
            }
            className="w-full px-3 py-2 text-left text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
