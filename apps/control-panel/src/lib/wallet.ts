import { getCloudflareContext } from '@opennextjs/cloudflare';
import { newId } from '@sequel/core/ids';
import { addMoney } from '@sequel/core/pricing';
import { getForge } from './forge';

/**
 * Straight to D1, not through Better Auth's adapter.
 *
 * The adapter only knows models declared by a plugin — it rejected
 * `walletCredit` outright — and smuggling an application table into the auth
 * schema to borrow its query builder would put our domain inside the thing
 * that regenerates itself from plugin definitions.
 */
async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) throw new Error('D1 binding DB is missing.');
  return env.DB;
}

export interface WalletCredit {
  id: string;
  organizationId: string;
  amountUsd: string;
  source: 'test_credit' | 'stripe' | 'grant';
  reference: string | null;
  createdByUserId: string | null;
  createdAt: string;
}

export interface Wallet {
  /** Everything ever added. */
  creditedUsd: string;
  /** Everything spent, from the task ledger. */
  spentUsd: string;
  /** credited − spent. Can go negative: a run is not refused for lack of funds. */
  availableUsd: string;
  credits: WalletCredit[];
}

/**
 * The balance is derived, never stored.
 *
 * A balance column drifts from its own history the first time a write is lost
 * or replayed; a sum of the ledger cannot. Spend comes from the task store on
 * the same principle — the runs are the source of truth for what was used.
 *
 * Nothing here refuses a run for lack of funds. Metering and enforcement are
 * different problems, and the second one needs a payment provider to be worth
 * having.
 */
export async function getWallet(organizationId: string): Promise<Wallet> {
  const { results } = await (await db())
    .prepare(
      `SELECT id, organizationId, amountUsd, source, reference, createdByUserId, createdAt
         FROM walletCredit
        WHERE organizationId = ?
        ORDER BY createdAt DESC
        LIMIT 500`,
    )
    .bind(organizationId)
    .all<WalletCredit>();

  const credits = results ?? [];

  const creditedUsd = credits.reduce((sum, c) => addMoney(sum, c.amountUsd), '0.000000');

  // All time, not the 30-day window: a wallet is a balance, not a report.
  const { totalUsd } = await getForge().usage(36_500, organizationId);

  return {
    creditedUsd,
    spentUsd: totalUsd,
    availableUsd: addMoney(creditedUsd, `-${totalUsd}`),
    credits,
  };
}

export async function addCredit(params: {
  organizationId: string;
  amountUsd: string;
  userId: string;
  source?: WalletCredit['source'];
}): Promise<WalletCredit> {
  const credit: WalletCredit = {
    id: newId('walletCredit'),
    organizationId: params.organizationId,
    amountUsd: params.amountUsd,
    // Defaults to test_credit on purpose. A row only claims to be a real
    // payment when something real produced it.
    source: params.source ?? 'test_credit',
    reference: null,
    createdByUserId: params.userId,
    createdAt: new Date().toISOString(),
  };

  await (await db())
    .prepare(
      `INSERT INTO walletCredit
         (id, organizationId, amountUsd, source, reference, createdByUserId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      credit.id,
      credit.organizationId,
      credit.amountUsd,
      credit.source,
      credit.reference,
      credit.createdByUserId,
      credit.createdAt,
    )
    .run();

  return credit;
}
