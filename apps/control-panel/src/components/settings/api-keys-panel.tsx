'use client';

import { Alert, Card, CheckIcon, CopyIcon, Field, Input, Modal, PrimaryButton, SubmitButton } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export interface ApiKeyView {
  id: string;
  name: string;
  start: string | null;
  prefix: string | null;
  enabled: boolean;
  createdAt: string;
  lastRequest: string | null;
}

function when(iso: string | null): string {
  if (!iso) return 'never used';
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return '—';
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return 'today';
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

export function ApiKeysPanel({ keys }: { keys: ApiKeyView[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { data, error: failure } = await authClient.apiKey.create({ name: name.trim() });
    if (failure) {
      setError(failure.message ?? 'Could not create that key.');
      setBusy(false);
      return;
    }

    setBusy(false);
    setCreating(false);
    setName('');
    // The only moment the plaintext key exists. Everything stored is a hash.
    setRevealed(data?.key ?? null);
    router.refresh();
  }

  async function revoke(id: string) {
    await authClient.apiKey.delete({ keyId: id });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-6">
        <p className="max-w-xl text-[13px] leading-relaxed text-[var(--color-muted)]">
          Keys for calling Sequel outside this dashboard.
        </p>
        <PrimaryButton onClick={() => setCreating(true)}>New key</PrimaryButton>
      </div>

      {/*
        Said plainly because a key that looks real and protects nothing is
        worse than no key at all. /api/mcp is still open.
      */}
      <div className="mb-5">
        <Alert tone="info">
          Nothing checks these yet — the MCP endpoint and REST API are still
          unauthenticated. Creating a key is safe, but it does not protect anything until
          verification is wired up.
        </Alert>
      </div>

      {keys.length === 0 ? (
        <Card className="px-5 py-14 text-center">
          <div className="text-[14px] text-[var(--color-text)]">No keys yet</div>
          <div className="mt-2 text-[13px] text-[var(--color-muted)]">
            Create one to call Sequel from your own code.
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {keys.map((key, index) => (
            <div
              key={key.id}
              className={[
                'flex items-center gap-4 px-5 py-3.5',
                index > 0 ? 'border-t border-[var(--color-line)]' : '',
              ].join(' ')}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px]">{key.name}</div>
                <code className="mt-0.5 block truncate font-mono text-[12px] text-[var(--color-dim)]">
                  {key.start ? `${key.start}…` : key.prefix ?? 'sk_sequel_…'}
                </code>
              </div>

              <span className="w-[110px] text-right text-[12px] text-[var(--color-dim)]">
                {when(key.lastRequest)}
              </span>

              <div className="w-[70px] text-right">
                <button
                  type="button"
                  onClick={() => void revoke(key.id)}
                  className="text-[12px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-pink)]"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={creating}
        onClose={() => {
          setCreating(false);
          setName('');
          setError(null);
        }}
        title="New API key"
        description="Name it after where it will be used, so you know what you are revoking later."
      >
        <form onSubmit={create} className="space-y-4">
          <Field label="Name">
            <Input
              autoFocus
              required
              maxLength={60}
              placeholder="Local dev"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          {error && <Alert>{error}</Alert>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-full px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              Cancel
            </button>
            <SubmitButton busy={busy} disabled={!name.trim()}>
              Create key
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={revealed !== null}
        onClose={() => {
          setRevealed(null);
          setCopied(false);
        }}
        title="Copy your key"
        description="This is the only time it is shown. Only a hash is stored, so it cannot be recovered."
        width={520}
      >
        <div className="flex items-center gap-3 rounded-xl bg-[var(--color-card-hover)] py-2.5 pl-4 pr-2">
          <code className="flex-1 truncate font-mono text-[13px]">{revealed}</code>
          <button
            type="button"
            onClick={() => {
              if (!revealed) return;
              void navigator.clipboard.writeText(revealed).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
