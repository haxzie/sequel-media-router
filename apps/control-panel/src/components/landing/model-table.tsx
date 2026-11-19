'use client';

import { useState } from 'react';
import { ProviderMark } from './provider-mark';

/**
 * The whole catalogue, filterable.
 *
 * Client-side because the list is small enough to ship whole — twenty rows
 * of text is less than one of the images on the home page, and a round trip
 * per keystroke to filter it would be slower than not filtering at all.
 *
 * Everything shown is the registry's own: names, capabilities, published
 * rates and the advisory ETA. Nothing here is marketing copy with a number
 * in it, which is the point of putting the catalogue on a page at all.
 *
 * It takes flattened rows rather than models. A model carries its zod input
 * schema and its `run` function, neither of which can cross into a client
 * component — the server flattens first, and the only thing shipped is the
 * text this renders.
 */

type Modality = 'image' | 'video' | 'audio';

const TABS: Array<{ value: Modality | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
];

export interface ModelRow {
  id: string;
  name: string;
  provider: string;
  modality: string;
  description: string;
  capabilities: string[];
  rate: string;
  eta: number;
  async: boolean;
  /** Name, id, provider, description and keywords, lowercased, for the filter. */
  haystack: string;
}

export function ModelTable({ rows }: { rows: ModelRow[] }) {
  const [modality, setModality] = useState<Modality | 'all'>('all');
  const [query, setQuery] = useState('');

  const shown = rows.filter(
    (row) =>
      (modality === 'all' || row.modality === modality) &&
      (query.trim() === '' || row.haystack.includes(query.trim().toLowerCase())),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="chip-group">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setModality(tab.value)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                modality === tab.value
                  ? 'bg-[var(--color-card)] text-[var(--color-text)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="chip h-9 min-w-0 flex-1 px-4 sm:max-w-[320px]">
          <span className="sr-only">Search models</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or use case…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--color-dim)]"
          />
        </label>

        <span className="nums text-[12.5px] text-[var(--color-dim)]">
          {shown.length} of {rows.length}
        </span>
      </div>

      {/* Frosted rather than filled: the arcs pass behind the top right of
          this list, and blurring them is what makes the panel read as glass
          over the page instead of a darker rectangle on it. */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        {shown.map((row, index) => (
          <div
            key={row.id}
            className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03] ${
              index > 0 ? 'border-t border-white/[0.07]' : ''
            }`}
          >
            <ProviderMark provider={row.provider} name={row.name} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-[14.5px] text-[var(--color-text)]">{row.name}</span>
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
                  {row.modality}
                </span>
                {row.async && (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-[var(--color-dim)]">
                    async
                  </span>
                )}
              </div>

              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
                {row.description}
              </p>

              <p className="mt-1.5 font-mono text-[11.5px] text-[var(--color-dim)]">{row.id}</p>
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              <div className="nums font-mono text-[12.5px] text-[var(--color-muted)]">
                {row.rate}
              </div>
              <div className="nums mt-1 font-mono text-[11.5px] text-[var(--color-dim)]">
                ~{row.eta}s
              </div>
            </div>
          </div>
        ))}

        {shown.length === 0 && (
          <p className="px-5 py-10 text-center text-[13.5px] text-[var(--color-muted)]">
            Nothing matches “{query}”. Your agent would have had the same problem — try a use
            case rather than a model name.
          </p>
        )}
      </div>
    </div>
  );
}
