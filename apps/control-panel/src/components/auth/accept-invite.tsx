'use client';

import { Alert } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function AcceptInvite({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(kind: 'accept' | 'reject') {
    setBusy(kind);
    setError(null);

    const call =
      kind === 'accept'
        ? authClient.organization.acceptInvitation({ invitationId })
        : authClient.organization.rejectInvitation({ invitationId });

    const { error: failure } = await call;
    if (failure) {
      setError(failure.message ?? 'Could not complete that.');
      setBusy(null);
      return;
    }

    router.replace('/continue');
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void act('accept')}
        className="w-full rounded-full bg-white px-4 py-2.5 text-[14px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy === 'accept' ? 'Joining…' : 'Accept invitation'}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void act('reject')}
        className="w-full rounded-full border border-[var(--color-line-strong)] px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
      >
        Decline
      </button>
    </div>
  );
}
