'use client';

import { formatUsd } from '@forge/core/pricing';
import { useEffect, useState } from 'react';
import { Eyebrow } from './ui';

interface Usage {
  totalUsd: string;
  taskCount: number;
  windowDays: number;
  byModality: Record<string, { usd: string; count: number }>;
}

const BAR_TONE: Record<string, string> = {
  image: 'var(--color-periwinkle)',
  video: 'var(--color-pink)',
  audio: 'var(--color-sand)',
};

/** Spend card pinned to the foot of the sidebar. */
export function UsageCard() {
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    const load = () =>
      fetch('/api/usage')
        .then((r) => r.json())
        .then(setUsage)
        .catch(() => undefined);
    load();
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, []);

  const total = Number(usage?.totalUsd ?? 0);

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-card)] p-4">
      <div className="flex items-baseline justify-between">
        <Eyebrow>Usage</Eyebrow>
        <span className="text-[11px] text-[var(--color-dim)]">{usage?.windowDays ?? 30}d</span>
      </div>

      <div className="display nums mt-2 text-[28px] leading-none">
        {usage ? formatUsd(usage.totalUsd) : '—'}
      </div>
      <div className="mt-1 text-[12px] text-[var(--color-dim)]">
        {usage ? `${usage.taskCount} run${usage.taskCount === 1 ? '' : 's'}` : 'loading'}
      </div>

      {usage && total > 0 && (
        <div className="mt-3 flex h-1 overflow-hidden rounded-full bg-white/8">
          {Object.entries(usage.byModality).map(([modality, bucket]) => {
            const share = (Number(bucket.usd) / total) * 100;
            if (share <= 0) return null;
            return (
              <div
                key={modality}
                style={{ width: `${share}%`, background: BAR_TONE[modality] }}
                title={`${modality}: ${formatUsd(bucket.usd)}`}
              />
            );
          })}
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        {usage &&
          Object.entries(usage.byModality).map(([modality, bucket]) => (
            <div key={modality} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2 capitalize text-[var(--color-muted)]">
                <span
                  className="h-[6px] w-[6px] rounded-full"
                  style={{ background: BAR_TONE[modality] }}
                />
                {modality}
              </span>
              <span className="nums text-[var(--color-dim)]">{formatUsd(bucket.usd)}</span>
            </div>
          ))}
      </div>

      <div className="mt-3 border-t border-[var(--color-line)] pt-2.5 text-[11px] text-[var(--color-dim)]">
        Estimated from published rates
      </div>
    </div>
  );
}
