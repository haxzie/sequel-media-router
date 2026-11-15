import { resolveActor } from '@/lib/actor';
import { createWebhook, listWebhooks, WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/webhooks';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ webhooks: [] });

  // The secret is never returned by a list. It is shown once, at creation.
  const webhooks = (await listWebhooks(actor.organizationId)).map(({ secret, ...rest }) => ({
    ...rest,
    events: JSON.parse(rest.events) as string[],
  }));

  return Response.json({ webhooks });
}

export async function POST(request: Request) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'No organisation' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    url?: string;
    events?: string[];
    description?: string;
  } | null;

  const url = body?.url?.trim();
  if (!url) return Response.json({ error: 'A URL is required' }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: 'That is not a valid URL' }, { status: 400 });
  }

  /*
   * HTTPS only, except on loopback for local development. A signed payload
   * sent over plain HTTP can be read in transit, and the signature only
   * proves it came from us — it does not hide what is in it.
   */
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    return Response.json(
      { error: 'Endpoint must be https (http is allowed on localhost only)' },
      { status: 400 },
    );
  }

  const events = (body?.events ?? []).filter((event): event is WebhookEvent =>
    (WEBHOOK_EVENTS as readonly string[]).includes(event),
  );
  if (events.length === 0) {
    return Response.json({ error: 'Pick at least one event' }, { status: 400 });
  }

  const webhook = await createWebhook({
    organizationId: actor.organizationId,
    url,
    events,
    description: body?.description?.trim() || null,
    userId: actor.userId,
  });

  // The only response that carries the secret.
  return Response.json({ webhook: { ...webhook, events } });
}
