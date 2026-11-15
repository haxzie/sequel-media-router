'use client';

import { Alert, Field, Input, Modal, Select, SubmitButton } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * Inviting is occasional, so it does not earn permanent space on the page. The
 * dialog also gives the "emails are not sent yet" caveat somewhere to live
 * where it is read at the moment it matters rather than ignored as furniture.
 */
export function InviteDialog({
  open,
  organizationId,
  onClose,
  onInvited,
}: {
  open: boolean;
  organizationId: string;
  onClose: () => void;
  onInvited: (invitationId: string | null) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setEmail('');
    setRole('member');
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { data, error: failure } = await authClient.organization.inviteMember({
      email: email.trim(),
      role: role as 'member',
      organizationId,
    });

    if (failure) {
      setError(failure.message ?? 'Could not send that invitation.');
      setBusy(false);
      return;
    }

    setBusy(false);
    onInvited(data?.id ?? null);
    close();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Invite to your team"
      description="They will get owner-set access to this organisation's models, tasks and spend."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            required
            autoFocus
            placeholder="teammate@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field
          label="Role"
          hint={
            role === 'admin'
              ? 'Admins can invite and remove people.'
              : 'Members can use the models but not change the team.'
          }
        >
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>

        {error && <Alert>{error}</Alert>}

        <Alert tone="info">
          Invitation emails are not sent yet. The invite will appear below as a pending row — copy
          the link from there and send it yourself.
        </Alert>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="rounded-full px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
          <SubmitButton busy={busy} disabled={!email.trim()}>
            Send invitation
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
