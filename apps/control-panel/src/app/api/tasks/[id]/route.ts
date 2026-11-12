import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

/**
 * Full detail for one task, for the dashboard's result panel: input, assets and
 * the untouched provider payload. The list endpoint deliberately omits all
 * three — an agent polling for status does not want them.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getForge().getTask(id);
  if (!task) return Response.json({ error: 'No such task' }, { status: 404 });
  return Response.json({ task });
}
