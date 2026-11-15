'use client';

import { CheckIcon } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import type { SidebarOrg } from './sidebar';

/**
 * Switching organization rewrites the session's activeOrganizationId, which is
 * what every org-scoped query reads. A full refresh follows so server
 * components re-render against the new org rather than showing the old one's
 * data under the new name.
 */
export function OrgSwitcher({
  organizations,
  activeId,
}: {
  organizations: SidebarOrg[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const active = organizations.find((org) => org.id === activeId) ?? organizations[0];
  if (!active) return null;

  async function select(id: string) {
    if (id === activeId) return setOpen(false);
    setBusy(true);
    await authClient.organization.setActive({ organizationId: id });
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <div ref={box} className="relative px-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={busy}
        className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-[var(--color-card)]"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-card-hover)] text-[12px] font-semibold uppercase text-[var(--color-muted)]">
          {active.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] text-[var(--color-text)]">{active.name}</div>
          <div className="truncate text-[11px] text-[var(--color-dim)]">{active.slug}</div>
        </div>
        <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 text-[var(--color-dim)]" aria-hidden>
          <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-1 right-1 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] py-1 shadow-xl">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => void select(org.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
            >
              <span className="truncate">{org.name}</span>
              {org.id === activeId && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
