'use client';

import { Alert, Field, Input, Modal, SubmitButton } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * A new team is a new organization with its own members and invitations.
 *
 * It is NOT yet its own models, tasks or spend: the Forge store has no
 * organization column, so those are still global across every team. The copy
 * here says only what is true — promising an isolated workspace would be a
 * lie a user discovers by switching teams and seeing the same task list.
 */
export function CreateOrgDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setName('');
    setError(null);
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Could not create that team.');
      setBusy(false);
      return;
    }

    setBusy(false);
    close();
    // The server made it active, so a refresh is what moves the whole shell —
    // sidebar, usage, every org-scoped page — onto the new team.
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create a team"
      description="A separate team with its own members and invitations."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Team name" hint="You can rename it later.">
          <Input
            autoFocus
            required
            maxLength={60}
            placeholder="Acme Inc"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="rounded-full px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
          <SubmitButton busy={busy} disabled={!name.trim()}>
            Create team
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
