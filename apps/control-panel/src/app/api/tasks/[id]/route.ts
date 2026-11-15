import { resolveActor } from '@/lib/actor';
import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

/**
 * Full detail for one task, for the dashboard's result panel: input, assets and
 * the untouched provider payload. The list endpoint deliberately omits all
 * three — an agent polling for status does not want them.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'No such task' }, { status: 404 });

  // Same 404 whether it does not exist or belongs to another team: a different
  // status would confirm the id is real.
  const task = await getForge().getTask(id, actor.organizationId);
  if (!task) return Response.json({ error: 'No such task' }, { status: 404 });
  return Response.json({ task });
}
