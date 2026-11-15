'use client';

import { PageHeader } from '@sequel/ui';
import { useState } from 'react';
import { UsageBreakdown } from './usage-breakdown';
import { UsageChart } from './usage-chart';
import { WalletCard } from './wallet-card';

/**
 * The window dropdown lives in the chart card but governs the breakdowns too —
 * two controls for one idea would let the page show a 7-day chart above
 * 30-day totals and look consistent while doing it.
 */
export function UsagePanels() {
  const [days, setDays] = useState(30);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumb={['Sequel', 'Usage']}
        title="Usage"
        meta={<>What this team has run, and what is left to run it with.</>}
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <UsageChart onWindowChange={setDays} />
        <WalletCard />
      </div>

      <UsageBreakdown days={days} />
    </div>
  );
}
