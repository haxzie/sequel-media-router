import { resolveActor } from '@/lib/actor';
import { addCredit, getWallet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'No organisation' }, { status: 401 });
  return Response.json(await getWallet(actor.organizationId));
}

/**
 * Add funds.
 *
 * No card is charged — there is no payment provider connected, so every row
 * this writes is marked `test_credit`. The endpoint still exists because the
 * ledger, the balance and the billing history are real and worth exercising;
 * only the money is not.
 */
export async function POST(request: Request) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'No organisation' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { amountUsd?: string } | null;
  const amount = Number(body?.amountUsd);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000) {
    return Response.json({ error: 'Amount must be between $0 and $10,000' }, { status: 400 });
  }

  await addCredit({
    organizationId: actor.organizationId,
    amountUsd: amount.toFixed(6),
    userId: actor.userId,
  });

  return Response.json(await getWallet(actor.organizationId));
}
