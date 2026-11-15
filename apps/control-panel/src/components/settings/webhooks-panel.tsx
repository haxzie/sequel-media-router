'use client';

import {
  Alert,
  Card,
  CheckIcon,
  CopyIcon,
  Field,
  Input,
  Modal,
  MultiChoiceGroup,
  PrimaryButton,
  RowMenu,
  StatusDot,
  SubmitButton,
} from '@sequel/ui';
import { useEffect, useState } from 'react';

const EVENTS = [
  { value: 'task.completed', label: 'task.completed', hint: 'A run produced its output' },
  { value: 'task.failed', label: 'task.failed', hint: 'A run ended without one' },
];

export interface WebhookView {
  id: string;
  url: string;
  events: string[];
  enabled: number;
  description: string | null;
  createdAt: string;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: number | null;
}

interface Delivery {
  id: string;
  eventType: string;
  responseStatus: number | null;
  error: string | null;
  durationMs: number | null;
  attempt: number;
  createdAt: string;
}

function when(iso: string | null): string {
  if (!iso) return 'never';
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function statusTone(status: number | null): string {
  if (status === null) return 'var(--status-failed)';
  if (status >= 200 && status < 300) return 'var(--status-done)';
  if (status >= 400 && status < 500) return 'var(--status-running)';
  return 'var(--status-failed)';
}

export function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState<WebhookView[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ url: string; secret: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const data = (await fetch('/api/webhooks').then((r) => r.json())) as {
      webhooks: WebhookView[];
    };
    setWebhooks(data.webhooks ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-6">
        <p className="max-w-xl text-[13px] leading-relaxed text-[var(--color-muted)]">
          We POST a signed JSON event to your endpoint when a run settles, so you do not have to
          poll <code className="font-mono text-[12px]">list_tasks</code>.
        </p>
        <PrimaryButton onClick={() => setCreating(true)}>Add endpoint</PrimaryButton>
      </div>

      {/*
        Said once, here: there is no durable queue behind delivery, so an
        endpoint that is down long enough loses the event. Better stated than
        discovered.
      */}
      <div className="mb-5">
        <Alert tone="info">
          Delivery is at-least-once and retries three times over a few seconds. There is no
          durable queue yet, so an endpoint that stays down will miss events — treat the webhook
          as a fast path and <code className="font-mono text-[12px]">list_tasks</code> as the
          source of truth.
        </Alert>
      </div>

      {webhooks === null ? (
        <Card className="px-5 py-14 text-center text-[13px] text-[var(--color-muted)]">
          Loading…
        </Card>
      ) : webhooks.length === 0 ? (
        <Card className="px-5 py-14 text-center">
          <div className="text-[14px] text-[var(--color-text)]">No endpoints yet</div>
          <div className="mt-2 text-[13px] text-[var(--color-muted)]">
            Add one to be told when a run finishes.
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {webhooks.map((webhook, index) => (
            <WebhookRow
              key={webhook.id}
              webhook={webhook}
              divided={index > 0}
              expanded={expanded === webhook.id}
              onToggleExpand={() => setExpanded(expanded === webhook.id ? null : webhook.id)}
              onPatch={(body) => patch(webhook.id, body)}
              onDelete={async () => {
                await fetch(`/api/webhooks/${webhook.id}`, { method: 'DELETE' });
                await load();
              }}
            />
          ))}
        </Card>
      )}

      <SchemaReference />

      <CreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={async (created) => {
          setRevealed({ url: created.url, secret: created.secret });
          await load();
        }}
      />

      <Modal
        open={revealed !== null}
        onClose={() => setRevealed(null)}
        title="Copy your signing secret"
        description="Shown once. Use it to verify the Sequel-Signature header on every delivery."
        width={560}
      >
        {revealed && <SecretField secret={revealed.secret} />}
      </Modal>
    </div>
  );
}

function WebhookRow({
  webhook,
  divided,
  expanded,
  onToggleExpand,
  onPatch,
  onDelete,
}: {
  webhook: WebhookView;
  divided: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    fetch(`/api/webhooks/${webhook.id}`)
      .then((r) => r.json() as Promise<{ deliveries: Delivery[] }>)
      .then((data) => setDeliveries(data.deliveries ?? []))
      .catch(() => setDeliveries([]));
  }, [expanded, webhook.id, webhook.lastDeliveryAt]);

  return (
    <div className={divided ? 'border-t border-[var(--color-line)]' : ''}>
      <div
        className={[
          'flex items-center gap-4 px-5 py-3.5',
          webhook.enabled ? '' : 'opacity-50',
          busy ? 'opacity-50' : '',
        ].join(' ')}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[13px]">{webhook.url}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[var(--color-dim)]">
            <span>{webhook.events.join(', ')}</span>
            {webhook.description && <span>· {webhook.description}</span>}
          </div>
        </div>

        <StatusDot color={statusTone(webhook.lastDeliveryStatus)}>
          <span className="text-[12px] text-[var(--color-muted)]">
            {webhook.lastDeliveryAt
              ? `${webhook.lastDeliveryStatus ?? 'no response'} · ${when(webhook.lastDeliveryAt)}`
              : 'never delivered'}
          </span>
        </StatusDot>

        <button
          type="button"
          onClick={onToggleExpand}
          className="shrink-0 text-[12px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-text)]"
        >
          {expanded ? 'Hide' : 'Deliveries'}
        </button>

        <RowMenu
          label={`Actions for ${webhook.url}`}
          items={[
            {
              label: 'Send test event',
              onSelect: async () => {
                setBusy(true);
                await onPatch({ test: true });
                setBusy(false);
              },
            },
            {
              label: webhook.enabled ? 'Disable' : 'Enable',
              onSelect: () => void onPatch({ enabled: !webhook.enabled }),
            },
            { label: 'Delete', destructive: true, onSelect: () => void onDelete() },
          ]}
        />
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-line)] bg-[var(--color-card-hover)] px-5 py-3">
          {deliveries === null ? (
            <div className="py-3 text-[12px] text-[var(--color-dim)]">Loading…</div>
          ) : deliveries.length === 0 ? (
            <div className="py-3 text-[12px] text-[var(--color-dim)]">
              Nothing delivered yet. Send a test event from the menu.
            </div>
          ) : (
            <div className="space-y-2 py-1">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center gap-3 text-[12px]">
                  <span
                    className="w-[70px] shrink-0 font-mono"
                    style={{ color: statusTone(delivery.responseStatus) }}
                  >
                    {delivery.responseStatus ?? 'error'}
                  </span>
                  <span className="w-[120px] shrink-0 font-mono text-[var(--color-muted)]">
                    {delivery.eventType}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[var(--color-dim)]">
                    {delivery.error ?? `attempt ${delivery.attempt} · ${delivery.durationMs}ms`}
                  </span>
                  <span className="shrink-0 text-[var(--color-dim)]">
                    {when(delivery.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SecretField({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-card-hover)] py-2.5 pl-4 pr-2">
      <code className="flex-1 truncate font-mono text-[13px]">{secret}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(secret).then(() => {
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
  );
}

function CreateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (webhook: { url: string; secret: string }) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<string[]>(['task.completed', 'task.failed']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), events, description }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Could not add that endpoint.');
      setBusy(false);
      return;
    }

    const { webhook } = (await response.json()) as { webhook: { url: string; secret: string } };
    setBusy(false);
    setUrl('');
    setDescription('');
    onClose();
    await onCreated(webhook);
  }

  return (
    <Modal open={open} onClose={onClose} title="Add endpoint" width={520}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Endpoint URL" hint="https only, except on localhost.">
          <Input
            type="url"
            required
            autoFocus
            placeholder="https://example.com/hooks/sequel"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </Field>

        <Field label="Description" hint="Optional. What is on the other end.">
          <Input
            maxLength={80}
            placeholder="Production worker"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div>
          <div className="mb-1.5 text-[13px] text-[var(--color-muted)]">Events</div>
          <MultiChoiceGroup
            value={events}
            onChange={setEvents}
            options={EVENTS.map((event) => ({
              value: event.value,
              label: <span className="font-mono text-[13px]">{event.label}</span>,
              description: event.hint,
            }))}
          />
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
          <SubmitButton busy={busy} disabled={!url.trim() || events.length === 0}>
            Add endpoint
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

/** The contract, where someone wiring up a receiver will look for it. */
function SchemaReference() {
  const example = `POST https://your-endpoint
content-type: application/json
sequel-event-id: evt_...
sequel-event-type: task.completed
sequel-signature: t=1763251200,v1=<hex hmac-sha256>

{
  "id": "evt_9f2b...",
  "type": "task.completed",
  "created": "2026-11-15T20:14:03.412Z",
  "apiVersion": "2026-11-15",
  "data": {
    "task": {
      "id": "task_b3b50c452f4b4435ab1a",
      "status": "completed",
      "model": "google/veo-3.1",
      "modality": "video",
      "label": "a ceramic mug rotating slowly",
      "organizationId": "org_6EzZ...",
      "createdAt": "2026-11-15T20:13:41.004Z",
      "completedAt": "2026-11-15T20:14:03.412Z",
      "cost": { "usd": "0.800000", "estimated": true },
      "assets": [{ "url": "https://.../f/NfMNQ9Rjgw", "mime": "video/mp4", "bytes": 885383 }],
      "error": null,
      "createdBy": { "userId": "usr_...", "via": "api_key" }
    }
  }
}`;

  return (
    <div className="mt-8">
      <div className="mb-2 text-[13px] text-[var(--color-muted)]">What we send</div>
      <Card className="overflow-hidden">
        <pre className="scroll-area overflow-x-auto px-5 py-4 font-mono text-[11px] leading-relaxed text-[var(--color-muted)]">
          {example}
        </pre>
      </Card>
      <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-dim)]">
        Verify by computing <code className="font-mono">HMAC-SHA256(secret, "{'{t}'}.{'{body}'}")</code>{' '}
        and comparing it to <code className="font-mono">v1</code>. The timestamp is inside the
        signed string, so a captured request cannot be replayed later. <code className="font-mono">id</code> is
        stable across retries — store it and ignore one you have already handled.
      </p>
    </div>
  );
}
