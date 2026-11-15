'use client';

import { formatUsd, formatUsdRounded } from '@sequel/core/pricing';
import { Card, Eyebrow, Select } from '@sequel/ui';
import { useEffect, useMemo, useState } from 'react';

type Modality = 'image' | 'video' | 'audio';

interface Day {
  date: string;
  image: string;
  video: string;
  audio: string;
}

const SERIES: Array<{ key: Modality; label: string; color: string }> = [
  { key: 'image', label: 'Image', color: 'var(--chart-image)' },
  { key: 'video', label: 'Video', color: 'var(--chart-video)' },
  { key: 'audio', label: 'Audio', color: 'var(--chart-audio)' },
];

const WINDOWS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Daily spend, stacked by modality.
 *
 * Stacked rather than grouped because the question is "what did we spend",
 * with the split as the secondary read — grouped bars answer the comparison
 * first and make the total something you add up by eye.
 */
export function UsageChart({ onWindowChange }: { onWindowChange?: (days: number) => void }) {
  const [days, setDays] = useState('30');
  const [data, setData] = useState<Day[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/usage/series?days=${days}`)
      .then((r) => r.json() as Promise<{ days: Day[] }>)
      .then((payload) => setData(payload.days ?? []))
      .catch(() => setData([]));
  }, [days]);

  const { max, total } = useMemo(() => {
    let max = 0;
    let total = 0;
    for (const day of data ?? []) {
      const sum = Number(day.image) + Number(day.video) + Number(day.audio);
      if (sum > max) max = sum;
      total += sum;
    }
    return { max, total };
  }, [data]);

  return (
    <Card className="flex h-full flex-col px-5 py-5">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Spend</Eyebrow>
          <div className="display nums mt-2 text-[32px] leading-none">
            {formatUsdRounded(total)}
          </div>
        </div>
        <div className="w-[150px] shrink-0">
          <Select
            value={days}
            aria-label="Time range"
            onChange={(event) => {
              setDays(event.target.value);
              onWindowChange?.(Number(event.target.value));
            }}
          >
            {WINDOWS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Legend, because three series must never be identified by colour alone. */}
      <div className="mb-4 mt-3 flex items-center gap-4">
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5 text-[12px]">
            <span className="h-[8px] w-[8px] rounded-[2px]" style={{ background: series.color }} />
            <span className="text-[var(--color-muted)]">{series.label}</span>
          </span>
        ))}
      </div>

      <div className="relative min-h-[140px] flex-1">
        {data === null ? (
          <div className="flex h-full items-center text-[13px] text-[var(--color-dim)]">
            Loading…
          </div>
        ) : max === 0 ? (
          <div className="flex h-full items-center text-[13px] text-[var(--color-dim)]">
            No spend in this window.
          </div>
        ) : (
          <>
            <div className="flex h-[140px] items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
              {data.map((day, index) => {
                const sum = Number(day.image) + Number(day.video) + Number(day.audio);
                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHover(index)}
                    // The hit target is the full column height, not the bar —
                    // a quiet day is 2px tall and otherwise unhoverable.
                    className="relative flex h-full flex-1 cursor-default flex-col justify-end"
                  >
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-t-[4px] transition-opacity"
                      style={{
                        height: `${Math.max((sum / max) * 100, sum > 0 ? 2 : 0)}%`,
                        opacity: hover === null || hover === index ? 1 : 0.4,
                      }}
                    >
                      {SERIES.map((series) => {
                        const value = Number(day[series.key]);
                        if (value <= 0) return null;
                        return (
                          <div
                            key={series.key}
                            style={{
                              height: `${(value / sum) * 100}%`,
                              background: series.color,
                              // 2px of surface between stacked segments.
                              boxShadow: '0 -2px 0 0 var(--color-card)',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-[var(--color-dim)]">
              <span>{data[0] ? dayLabel(data[0].date) : ''}</span>
              <span>{data.at(-1) ? dayLabel(data.at(-1)!.date) : ''}</span>
            </div>

            {hover !== null && data[hover] && <Tooltip day={data[hover]!} />}
          </>
        )}
      </div>
    </Card>
  );
}

function Tooltip({ day }: { day: Day }) {
  const rows = SERIES.map((series) => ({ ...series, value: Number(day[series.key]) })).filter(
    (row) => row.value > 0,
  );
  const sum = rows.reduce((total, row) => total + row.value, 0);

  return (
    <div className="pointer-events-none absolute right-0 top-0 rounded-xl border border-[var(--color-line)] bg-[var(--color-card-hover)] px-3 py-2.5 shadow-xl">
      <div className="text-[12px] text-[var(--color-text)]">{dayLabel(day.date)}</div>
      {rows.length === 0 ? (
        <div className="mt-1 text-[12px] text-[var(--color-dim)]">No spend</div>
      ) : (
        <>
          {rows.map((row) => (
            <div key={row.key} className="mt-1 flex items-center gap-2 text-[12px]">
              <span
                className="h-[8px] w-[8px] shrink-0 rounded-[2px]"
                style={{ background: row.color }}
              />
              <span className="flex-1 text-[var(--color-muted)]">{row.label}</span>
              <span className="nums text-[var(--color-text)]">{formatUsd(row.value)}</span>
            </div>
          ))}
          <div className="mt-1.5 flex gap-4 border-t border-[var(--color-line)] pt-1.5 text-[12px]">
            <span className="flex-1 text-[var(--color-muted)]">Total</span>
            <span className="nums text-[var(--color-text)]">{formatUsd(sum)}</span>
          </div>
        </>
      )}
    </div>
  );
}
