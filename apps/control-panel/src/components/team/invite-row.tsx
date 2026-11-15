'use client';

import { CheckIcon, CopyIcon } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import type { InviteView } from './team-manager';

function daysLeft(iso: string): string {
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms)) return '';
  if (ms <= 0) return 'expired';
  const days = Math.ceil(ms / 86_400_000);
  return days === 1 ? 'expires tomorrow' : `expires in ${days} days`;
}

export function InviteRow({
  invite,
  canManage,
  highlight,
  divided,
}: {
  invite: InviteView;
  canManage: boolean;
  highlight: boolean;
  divided: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // The accept page resolves the invitation by id, so the id is the link.
  const link = typeof window === 'undefined' ? '' : `${window.location.origin}/invite/${invite.id}`;

  async function cancel() {
    setBusy(true);
    await authClient.organization.cancelInvitation({ invitationId: invite.id });
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      className={[
        'flex items-center gap-4 px-5 py-3.5',
        divided ? 'border-t border-[var(--color-line)]' : '',
        highlight ? 'bg-[var(--color-card-hover)]' : '',
        busy ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px]">{invite.email}</div>
        <div className="truncate text-[12px] text-[var(--color-dim)]">
          <span className="capitalize">{invite.role}</span> · {daysLeft(invite.expiresAt)}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line-strong)] px-3 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>

      <div className="w-[70px] text-right">
        {canManage && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void cancel()}
            className="text-[12px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-pink)]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
