import { resolveActor } from '@/lib/actor';
import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

const WINDOWS = [7, 30, 90];

export async function GET(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get('days') ?? 30);
  // Clamped to the windows the UI offers, so a hand-made request cannot ask
  // for a year of daily buckets and walk the whole task store.
  const days = WINDOWS.includes(requested) ? requested : 30;

  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ days: [], windowDays: days });

  return Response.json(await getForge().usageSeries(days, actor.organizationId));
}
