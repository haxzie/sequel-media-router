import { resolveActor } from '@/lib/actor';
import {
  buildEvent,
  deleteWebhook,
  deliver,
  listDeliveries,
  listWebhooks,
  setWebhookEnabled,
} from '@/lib/webhooks';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'Not found' }, { status: 404 });

  const webhook = (await listWebhooks(actor.organizationId)).find((entry) => entry.id === id);
  if (!webhook) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ deliveries: await listDeliveries(webhook.id) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'Not found' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as {
    enabled?: boolean;
    test?: boolean;
  } | null;

  const webhook = (await listWebhooks(actor.organizationId)).find((entry) => entry.id === id);
  if (!webhook) return Response.json({ error: 'Not found' }, { status: 404 });

  if (body?.test) {
    /*
     * A real event shape with an obviously fake task, so a receiver exercises
     * the same parsing path it will use in production rather than a special
     * "ping" branch that proves nothing.
     */
    await deliver(
      webhook,
      buildEvent(
        {
          id: 'task_test00000000000000',
          model: 'test/endpoint-check',
          modality: 'image',
          status: 'completed',
          label: 'Test delivery from the Sequel dashboard',
          input: {},
          costUsd: '0.000000',
          costEstimated: true,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          organizationId: actor.organizationId,
          assets: [],
        },
        'task.completed',
      ),
    );
    return Response.json({ deliveries: await listDeliveries(webhook.id) });
  }

  if (typeof body?.enabled === 'boolean') {
    await setWebhookEnabled(actor.organizationId, id, body.enabled);
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'Not found' }, { status: 404 });

  await deleteWebhook(actor.organizationId, id);
  return Response.json({ ok: true });
}
