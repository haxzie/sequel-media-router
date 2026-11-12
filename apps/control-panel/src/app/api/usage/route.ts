import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const days = Number(new URL(request.url).searchParams.get('days') ?? 30);
  return Response.json(await getForge().usage(Number.isFinite(days) ? days : 30));
}
