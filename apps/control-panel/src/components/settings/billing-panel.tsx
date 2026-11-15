'use client';

import { formatUsd } from '@sequel/core/pricing';
import { Alert, Avatar, Card } from '@sequel/ui';
import Link from 'next/link';

export interface CreditRow {
  id: string;
  amountUsd: string;
  source: 'test_credit' | 'stripe' | 'grant';
  createdAt: string;
  createdBy: { name: string; image: string | null } | null;
}

const SOURCE_LABEL: Record<CreditRow['source'], string> = {
  test_credit: 'Test credit',
  stripe: 'Card',
  grant: 'Grant',
};

function stamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function BillingPanel({
  credits,
  availableUsd,
  spentUsd,
}: {
  credits: CreditRow[];
  availableUsd: string;
  spentUsd: string;
}) {
  return (
    <div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <Card className="px-5 py-4">
          <div className="text-[12px] text-[var(--color-dim)]">Available</div>
          <div className="nums mt-1 text-[22px]">{formatUsd(availableUsd)}</div>
        </Card>
        <Card className="px-5 py-4">
          <div className="text-[12px] text-[var(--color-dim)]">Spent all time</div>
          <div className="nums mt-1 text-[22px]">{formatUsd(spentUsd)}</div>
        </Card>
      </div>

      {/*
        Every row here was added from the dashboard. Saying so once, above the
        table, beats a disclaimer per row — and beats letting the word
        "payment" imply something was charged.
      */}
      <div className="mb-5">
        <Alert tone="info">
          No payment provider is connected, so every entry below is a test credit added from the
          dashboard. Nothing has been charged.
        </Alert>
      </div>

      {credits.length === 0 ? (
        <Card className="px-5 py-14 text-center">
          <div className="text-[14px] text-[var(--color-text)]">No recharges yet</div>
          <div className="mt-2 text-[13px] text-[var(--color-muted)]">
            Add funds from{' '}
            <Link href="/usage" className="text-[var(--color-text)] underline underline-offset-2">
              Usage
            </Link>
            .
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-4 border-b border-[var(--color-line)] px-5 py-3 text-[12px] font-medium text-[var(--color-dim)]">
            <div className="flex-1">When</div>
            <div className="w-[140px]">Source</div>
            <div className="w-[160px]">Added by</div>
            <div className="w-[90px] text-right">Amount</div>
          </div>

          {credits.map((credit, index) => (
            <div
              key={credit.id}
              className={[
                'flex items-center gap-4 px-5 py-3.5',
                index > 0 ? 'border-t border-[var(--color-line)]' : '',
              ].join(' ')}
            >
              <div className="min-w-0 flex-1 text-[13px]">{stamp(credit.createdAt)}</div>
              <div className="w-[140px] text-[13px] text-[var(--color-muted)]">
                {SOURCE_LABEL[credit.source]}
              </div>
              <div className="flex w-[160px] items-center gap-2">
                {credit.createdBy ? (
                  <>
                    <Avatar name={credit.createdBy.name} src={credit.createdBy.image} size={20} />
                    <span className="truncate text-[13px] text-[var(--color-muted)]">
                      {credit.createdBy.name}
                    </span>
                  </>
                ) : (
                  <span className="text-[13px] text-[var(--color-dim)]">—</span>
                )}
              </div>
              <div className="nums w-[90px] text-right text-[13px]">
                {formatUsd(credit.amountUsd)}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
