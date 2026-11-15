'use client';

import { Alert, Card, CopyField, Field, Input, SubmitButton } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function OrganisationPanel({
  organization,
  viewerRole,
}: {
  organization: { id: string; name: string; slug: string };
  viewerRole: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Renaming is an owner's call. Admins run the team; they do not rebrand it.
  const canRename = viewerRole === 'owner';
  const dirty = name.trim() !== organization.name && name.trim().length > 0;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const { error: failure } = await authClient.organization.update({
      organizationId: organization.id,
      data: { name: name.trim() },
    });

    if (failure) {
      setError(failure.message ?? 'Could not save that.');
      setBusy(false);
      return;
    }

    setBusy(false);
    setSaved(true);
    // The name is in the sidebar too, so the whole shell has to re-render.
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="px-5 py-5">
        <form onSubmit={save} className="space-y-4">
          <Field
            label="Name"
            hint={canRename ? 'Shown in the sidebar and on invitations.' : undefined}
            error={canRename ? undefined : 'Only the owner can rename the organisation.'}
          >
            <Input
              required
              maxLength={60}
              disabled={!canRename}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
            />
          </Field>

          {error && <Alert>{error}</Alert>}

          {canRename && (
            <div className="flex items-center gap-3">
              <SubmitButton busy={busy} disabled={!dirty}>
                Save
              </SubmitButton>
              {saved && <span className="text-[13px] text-[var(--color-mint)]">Saved</span>}
            </div>
          )}
        </form>
      </Card>

      <div>
        <div className="mb-1.5 text-[13px] text-[var(--color-muted)]">Organisation ID</div>
        <CopyField value={organization.id} />
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-dim)]">
          Use this when you need to name this organisation to support, or in an API call once
          requests are scoped to one.
        </p>
      </div>

      <div>
        <div className="mb-1.5 text-[13px] text-[var(--color-muted)]">Slug</div>
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] px-3.5 py-2.5 font-mono text-[13px] text-[var(--color-muted)]">
          {organization.slug}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-dim)]">
          Set when the organisation was created and fixed — changing it would break any link that
          already uses it.
        </p>
      </div>
    </div>
  );
}
