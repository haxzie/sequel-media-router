import { getCloudflareContext } from '@opennextjs/cloudflare';
import { newId, randomSuffix } from '@sequel/core/ids';
import type { Task } from '@sequel/core';

/**
 * Outbound webhooks.
 *
 * One event shape for everything we will ever send, so a receiver can switch
 * on `type` and trust the envelope:
 *
 *   {
 *     "id":         "evt_...",        unique per event, stable across retries
 *     "type":       "task.completed",
 *     "created":    "2026-11-15T...", ISO-8601, when the event happened
 *     "apiVersion": "2026-11-15",
 *     "data":       { ... }           the object the event is about
 *   }
 *
 * `id` being stable across retries is the load-bearing part: delivery is
 * at-least-once, so a receiver must be able to recognise a repeat. Store the
 * id and ignore one you have already processed.
 */
export const WEBHOOK_API_VERSION = '2026-11-15';

export const WEBHOOK_EVENTS = ['task.completed', 'task.failed'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface Webhook {
  id: string;
  organizationId: string;
  url: string;
  secret: string;
  events: string;
  enabled: number;
  description: string | null;
  createdByUserId: string | null;
  createdAt: string;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: number | null;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  eventType: string;
  responseStatus: number | null;
  error: string | null;
  durationMs: number | null;
  attempt: number;
  createdAt: string;
}

async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) throw new Error('D1 binding DB is missing.');
  return env.DB;
}

/** `whsec_` so a leaked value is identifiable in a log or a paste. */
export function newWebhookSecret(): string {
  return `whsec_${randomSuffix(40)}`;
}

export function eventTypeFor(task: Task): WebhookEvent | null {
  if (task.status === 'completed') return 'task.completed';
  if (task.status === 'failed') return 'task.failed';
  return null;
}

/**
 * The body we POST.
 *
 * Deliberately a projection of the task, not the task row. `raw` is the
 * provider's untouched payload — megabytes for a video — and `input` can hold
 * a base64 image. Neither belongs in a request to a third party.
 */
export function buildEvent(task: Task, type: WebhookEvent) {
  return {
    id: newId('event'),
    type,
    created: task.completedAt ?? new Date().toISOString(),
    apiVersion: WEBHOOK_API_VERSION,
    data: {
      task: {
        id: task.id,
        status: task.status,
        model: task.model,
        modality: task.modality,
        label: task.label,
        organizationId: task.organizationId ?? null,
        createdAt: task.createdAt,
        completedAt: task.completedAt ?? null,
        cost: { usd: task.costUsd, estimated: task.costEstimated },
        assets: (task.assets ?? []).map((asset) => ({
          url: asset.url,
          mime: asset.mime,
          bytes: asset.bytes ?? null,
          ...(asset.text ? { text: asset.text } : {}),
        })),
        error: task.error ?? null,
        createdBy: task.createdBy
          ? { userId: task.createdBy.userId, via: task.createdBy.via }
          : null,
      },
    },
  };
}

/**
 * Stripe's signature scheme, because receivers already have code for it.
 *
 *   Sequel-Signature: t=<unix>,v1=<hex hmac of "t.body">
 *
 * The timestamp is inside the signed string, so a captured request cannot be
 * replayed later without breaking the signature — which is the whole reason
 * not to just sign the body alone.
 */
export async function signPayload(
  secret: string,
  body: string,
  timestamp = Math.floor(Date.now() / 1000),
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${hex}`;
}

export async function listWebhooks(organizationId: string): Promise<Webhook[]> {
  const { results } = await (await db())
    .prepare(`SELECT * FROM webhook WHERE organizationId = ? ORDER BY createdAt DESC`)
    .bind(organizationId)
    .all<Webhook>();
  return results ?? [];
}

export async function listDeliveries(webhookId: string, limit = 10): Promise<WebhookDelivery[]> {
  const { results } = await (await db())
    .prepare(
      `SELECT * FROM webhookDelivery WHERE webhookId = ? ORDER BY createdAt DESC LIMIT ?`,
    )
    .bind(webhookId, limit)
    .all<WebhookDelivery>();
  return results ?? [];
}

export async function createWebhook(params: {
  organizationId: string;
  url: string;
  events: WebhookEvent[];
  description: string | null;
  userId: string;
}): Promise<Webhook> {
  const webhook: Webhook = {
    id: newId('webhook'),
    organizationId: params.organizationId,
    url: params.url,
    secret: newWebhookSecret(),
    events: JSON.stringify(params.events),
    enabled: 1,
    description: params.description,
    createdByUserId: params.userId,
    createdAt: new Date().toISOString(),
    lastDeliveryAt: null,
    lastDeliveryStatus: null,
  };

  await (await db())
    .prepare(
      `INSERT INTO webhook
         (id, organizationId, url, secret, events, enabled, description,
          createdByUserId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      webhook.id,
      webhook.organizationId,
      webhook.url,
      webhook.secret,
      webhook.events,
      webhook.enabled,
      webhook.description,
      webhook.createdByUserId,
      webhook.createdAt,
    )
    .run();

  return webhook;
}

export async function deleteWebhook(organizationId: string, id: string): Promise<void> {
  await (await db())
    .prepare(`DELETE FROM webhook WHERE id = ? AND organizationId = ?`)
    .bind(id, organizationId)
    .run();
}

export async function setWebhookEnabled(
  organizationId: string,
  id: string,
  enabled: boolean,
): Promise<void> {
  await (await db())
    .prepare(`UPDATE webhook SET enabled = ? WHERE id = ? AND organizationId = ?`)
    .bind(enabled ? 1 : 0, id, organizationId)
    .run();
}

/**
 * Send one event to one endpoint, with a couple of quick retries.
 *
 * Honest about what this is NOT: there is no durable queue behind it. Retries
 * happen inside this request's lifetime, so an endpoint that is down for a
 * minute loses the event. A real delivery pipeline needs Cloudflare Queues or
 * a cron sweep over undelivered rows; until then every attempt is recorded so
 * the gap is at least visible.
 */
export async function deliver(webhook: Webhook, event: ReturnType<typeof buildEvent>) {
  const body = JSON.stringify(event);
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const startedAt = Date.now();
    let status: number | null = null;
    let error: string | null = null;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Sequel-Webhooks/1.0',
          'sequel-signature': await signPayload(webhook.secret, body),
          'sequel-event-id': event.id,
          'sequel-event-type': event.type,
          'sequel-delivery-attempt': String(attempt),
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      status = response.status;
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
    }

    await recordDelivery({
      webhookId: webhook.id,
      eventId: event.id,
      eventType: event.type,
      responseStatus: status,
      error,
      durationMs: Date.now() - startedAt,
      attempt,
    });

    // Any 2xx is success. A 4xx is the receiver saying "do not send this
    // again" — retrying it only produces more of the same rejection.
    if (status && status >= 200 && status < 300) return;
    if (status && status >= 400 && status < 500) return;

    if (attempt < attempts) await new Promise((r) => setTimeout(r, attempt * 1000));
  }
}

async function recordDelivery(delivery: Omit<WebhookDelivery, 'id' | 'createdAt'>) {
  const now = new Date().toISOString();
  const handle = await db();

  await handle.batch([
    handle
      .prepare(
        `INSERT INTO webhookDelivery
           (id, webhookId, eventId, eventType, responseStatus, error, durationMs, attempt, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId('webhookDelivery'),
        delivery.webhookId,
        delivery.eventId,
        delivery.eventType,
        delivery.responseStatus,
        delivery.error,
        delivery.durationMs,
        delivery.attempt,
        now,
      ),
    handle
      .prepare(`UPDATE webhook SET lastDeliveryAt = ?, lastDeliveryStatus = ? WHERE id = ?`)
      .bind(now, delivery.responseStatus, delivery.webhookId),
  ]);
}

/** Fan a settled task out to every endpoint in its organisation. */
export async function dispatchTask(task: Task): Promise<void> {
  const type = eventTypeFor(task);
  if (!type || !task.organizationId) return;

  const hooks = (await listWebhooks(task.organizationId)).filter(
    (hook) => hook.enabled && (JSON.parse(hook.events) as string[]).includes(type),
  );
  if (hooks.length === 0) return;

  // One event id across all endpoints: the same thing happened once, and a
  // receiver subscribed twice should be able to tell.
  const event = buildEvent(task, type);
  await Promise.all(hooks.map((hook) => deliver(hook, event).catch(() => undefined)));
}
