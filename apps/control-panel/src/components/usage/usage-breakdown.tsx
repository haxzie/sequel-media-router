'use client';

import { formatUsd } from '@sequel/core/pricing';
import { Avatar, Card, Eyebrow } from '@sequel/ui';
import { useEffect, useState } from 'react';

interface ModelRow {
  model: string;
  modality: 'image' | 'video' | 'audio';
  usd: string;
  count: number;
}

interface UserRow {
  userId: string;
  name: string;
  image?: string | null;
  usd: string;
  count: number;
}

const TONE: Record<ModelRow['modality'], string> = {
  image: 'var(--chart-image)',
  video: 'var(--chart-video)',
  audio: 'var(--chart-audio)',
};

export function UsageBreakdown({ days }: { days: number }) {
  const [data, setData] = useState<{ byModel: ModelRow[]; byUser: UserRow[] } | null>(null);

  useEffect(() => {
    fetch(`/api/usage/breakdown?days=${days}`)
      .then((r) => r.json() as Promise<{ byModel: ModelRow[]; byUser: UserRow[] }>)
      .then(setData)
      .catch(() => setData({ byModel: [], byUser: [] }));
  }, [days]);

  const modelMax = Math.max(...(data?.byModel ?? []).map((r) => Number(r.usd)), 0);
  const userMax = Math.max(...(data?.byUser ?? []).map((r) => Number(r.usd)), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Usage by model" empty={data !== null && data.byModel.length === 0}>
        {data?.byModel.map((row) => (
          <Row
            key={row.model}
            // The bar is the comparison; the number is the value. Both, because
            // a bar alone cannot be read precisely and a number alone cannot be
            // scanned.
            fraction={modelMax > 0 ? Number(row.usd) / modelMax : 0}
            tone={TONE[row.modality]}
            label={<code className="font-mono text-[12px]">{row.model}</code>}
            meta={`${row.count} run${row.count === 1 ? '' : 's'}`}
            value={formatUsd(row.usd)}
          />
        ))}
      </Panel>

      <Panel title="Usage by user" empty={data !== null && data.byUser.length === 0}>
        {data?.byUser.map((row) => (
          <Row
            key={row.userId}
            fraction={userMax > 0 ? Number(row.usd) / userMax : 0}
            tone="var(--color-line-strong)"
            label={
              <span className="flex items-center gap-2">
                <Avatar name={row.name} src={row.image} size={20} />
                <span className="truncate text-[13px]">{row.name}</span>
              </span>
            }
            meta={`${row.count} run${row.count === 1 ? '' : 's'}`}
            value={formatUsd(row.usd)}
          />
        ))}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="px-5 py-5">
      <Eyebrow className="mb-4">{title}</Eyebrow>
      {empty ? (
        <div className="py-8 text-center text-[13px] text-[var(--color-dim)]">
          Nothing in this window.
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </Card>
  );
}

function Row({
  fraction,
  tone,
  label,
  meta,
  value,
}: {
  fraction: number;
  tone: string;
  label: React.ReactNode;
  meta: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 truncate text-[var(--color-text)]">{label}</div>
        <span className="nums shrink-0 text-[13px]">{value}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-[var(--color-card-hover)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(fraction * 100, 1)}%`, background: tone }}
          />
        </div>
        <span className="shrink-0 text-[11px] text-[var(--color-dim)]">{meta}</span>
      </div>
    </div>
  );
}
