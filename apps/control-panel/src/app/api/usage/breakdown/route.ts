import { resolveActor } from '@/lib/actor';
import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

const WINDOWS = [7, 30, 90];

export async function GET(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get('days') ?? 30);
  const days = WINDOWS.includes(requested) ? requested : 30;

  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ byModel: [], byUser: [] });

  return Response.json(await getForge().usageBreakdown(days, actor.organizationId));
}
