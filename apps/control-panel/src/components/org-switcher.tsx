'use client';

import { AnvilIcon, Avatar, CheckIcon, PlusIcon } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { CreateOrgDialog } from './create-org-dialog';
import type { SidebarOrg } from './sidebar';

/**
 * Brand mark and organization picker in one row.
 *
 * A separate "Sequel" wordmark above this said nothing the page title does not
 * already say, and the slug under the name was an id nobody navigates by. What
 * is left is the one thing that changes: which organization you are looking at.
 *
 * Switching rewrites the session's activeOrganizationId, which is what every
 * org-scoped query reads. A full refresh follows so server components
 * re-render against the new org rather than showing the old one's data under
 * the new name.
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
  const [creating, setCreating] = useState(false);
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

  /*
   * Switching teams is a navigation now, not a state change.
   *
   * The team lives in the URL, so the layout sets the active organisation
   * from the path on arrival. Calling setActive here as well would be a
   * second source of truth that the next page load would overwrite anyway.
   */
  function select(id: string) {
    if (id === activeId) return setOpen(false);
    const next = organizations.find((org) => org.id === id);
    if (!next) return setOpen(false);
    setBusy(true);
    setOpen(false);
    router.push(`/${next.slug}`);
  }

  return (
    <div ref={box} className="relative px-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={busy}
        className="nav-item flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-[var(--color-card)]"
      >
        <AnvilIcon className="h-[18px] w-[18px] shrink-0 text-[var(--color-text)]" />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">
          {active.name}
        </span>
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
              className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
            >
              <Avatar name={org.name} size={22} />
              <span className="min-w-0 flex-1 truncate">{org.name}</span>
              {org.id === activeId && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}

          <div className="my-1 h-px bg-[var(--color-line)]" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreating(true);
            }}
            className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]"
          >
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
              <PlusIcon className="h-3.5 w-3.5" />
            </span>
            Create team
          </button>
        </div>
      )}

      <CreateOrgDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
