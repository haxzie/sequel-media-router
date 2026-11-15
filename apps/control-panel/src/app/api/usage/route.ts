import { resolveActor } from '@/lib/actor';
import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

/** Spend for the caller's organisation only. No credential, no spend. */
export async function GET(request: Request) {
  const days = Number(new URL(request.url).searchParams.get('days') ?? 30);
  const window = Number.isFinite(days) ? days : 30;

  const actor = await resolveActor(request);
  if (!actor?.organizationId) {
    return Response.json({
      totalUsd: '0.000000',
      taskCount: 0,
      windowDays: window,
      byModality: {
        image: { usd: '0.000000', count: 0 },
        video: { usd: '0.000000', count: 0 },
        audio: { usd: '0.000000', count: 0 },
      },
    });
  }

  return Response.json(await getForge().usage(window, actor.organizationId));
}
