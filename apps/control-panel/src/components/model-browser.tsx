'use client';

import { formatUsd } from '@sequel/core/pricing';
import { useEffect, useMemo, useState } from 'react';
import { CapabilityFilter } from './capability-filter';
import { CapabilityPills } from './capability-pills';
import { SearchIcon } from '@sequel/ui';
import { Card, PageHeader, Segmented } from '@sequel/ui';

type Modality = 'image' | 'video' | 'audio';

interface Rate {
  unit: string;
  usd: string;
  qualifier?: string;
}

interface ModelSummary {
  id: string;
  name: string;
  provider: string;
  modality: Modality;
  description: string;
  capabilities: string[];
  tags: string[];
  price: string;
  rates: Rate[];
  etaSeconds: number;
  async: boolean;
  enabled: boolean;
  requiresByok: boolean;
  score?: number;
}

const TABS: Array<{ value: Modality; label: string }> = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
];

/**
 * Brand marks, vendored under public/providers so the page makes no third-party
 * request at render time. Monochrome marks sit on a white tile the way the
 * reference does, which is also what makes them legible on a dark page.
 *
 * Leonardo has no mark here: its site 404s every icon path and rate-limits the
 * app subdomain. It falls through to the tinted monogram below, which is the
 * honest outcome rather than a wrong logo.
 */
const PROVIDER_LOGO: Record<string, string> = {
  google: '/providers/google.svg',
  openai: '/providers/openai.svg',
  alibaba: '/providers/alibaba.svg',
  elevenlabs: '/providers/elevenlabs.svg',
  deepgram: '/providers/deepgram.svg',
  minimax: '/providers/minimax.svg',
  'black-forest-labs': '/providers/black-forest-labs.svg',
  xai: '/providers/xai.png',
};

/** Fallback tint for a provider we have no mark for. */
const PROVIDER_TONE: Record<string, string> = {
  google: 'var(--color-sky)',
  openai: 'var(--color-mint)',
  minimax: 'var(--color-pink)',
  elevenlabs: 'var(--color-periwinkle)',
  xai: 'var(--color-sand)',
  alibaba: 'var(--color-sky)',
  bytedance: 'var(--color-periwinkle)',
  'black-forest-labs': 'var(--color-sand)',
  deepgram: 'var(--color-mint)',
  leonardo: 'var(--color-pink)',
};

/** Provider slugs are ids, not names. These are the names. */
const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  openai: 'OpenAI',
  minimax: 'MiniMax',
  elevenlabs: 'ElevenLabs',
  xai: 'xAI',
  alibaba: 'Alibaba',
  bytedance: 'ByteDance',
  'black-forest-labs': 'Black Forest Labs',
  deepgram: 'Deepgram',
  leonardo: 'Leonardo',
};

/**
 * Rate units are storage slugs. `tile_512` and `1m_tokens` are fine in JSON and
 * wrong on a price card, which is read by a person deciding what to spend.
 */
const UNIT_LABEL: Record<string, string> = {
  tile_512: '512px tile',
  '1m_tokens': '1M tokens',
  '1k_characters': '1K chars',
  megapixel: 'megapixel',
};

function ProviderTile({ provider }: { provider: string }) {
  const logo = PROVIDER_LOGO[provider];

  if (logo) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="h-[18px] w-[18px] object-contain" />
      </div>
    );
  }

  const tone = PROVIDER_TONE[provider] ?? 'var(--color-muted)';
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold uppercase"
      style={{ backgroundColor: `color-mix(in srgb, ${tone} 22%, transparent)`, color: tone }}
      aria-hidden
    >
      {provider.charAt(0)}
    </div>
  );
}

/** Headline rate, split so the figure can carry the weight and the unit can't. */
function Price({ model }: { model: ModelSummary }) {
  const rate = model.rates[0];
  if (!rate) return <span className="text-[13px] text-[var(--color-dim)]">unpriced</span>;

  // Where a model has several rate tiers, the row shows the cheapest and says
  // so — quoting one of four Veo prices with no qualifier would be a lie.
  const tiers = model.rates.length;
  return (
    <>
      <div className="whitespace-nowrap">
        <span className="nums text-[15px] text-[var(--color-text)]">{formatUsd(rate.usd)}</span>
        <span className="ml-1 text-[13px] text-[var(--color-dim)]">
          / {UNIT_LABEL[rate.unit] ?? rate.unit}
        </span>
      </div>
      <div className="mt-0.5 whitespace-nowrap text-[12px] text-[var(--color-dim)]">
        {rate.qualifier ?? `~${model.etaSeconds}s`}
        {tiers > 1 ? ` · ${tiers} tiers` : ''}
      </div>
    </>
  );
}

export function ModelBrowser() {
  const [tab, setTab] = useState<Modality>('image');
  const [query, setQuery] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);

  /*
   * The catalog is fetched once and filtered in the browser.
   *
   * Every tab switch used to be a round trip — `?type=` alone runs the whole
   * server search path — so moving between Image, Video and Audio flashed an
   * empty table each time. There are twenty models; the tab is a filter, not a
   * query, and a filter does not need the network.
   */
  const [catalog, setCatalog] = useState<ModelSummary[] | null>(null);

  // Ranked results, only while there is a query. Null means "show the catalog".
  const [results, setResults] = useState<ModelSummary[] | null>(null);
  const [mode, setMode] = useState('all');
  const [note, setNote] = useState<string | undefined>();
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json() as Promise<{ models: ModelSummary[] }>)
      .then((data) => setCatalog(data.models ?? []))
      .catch(() => setCatalog([]));
  }, []);

  // Debounced: each keystroke would otherwise fire an embedding call.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const handle = setTimeout(() => {
      fetch(`/api/models?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json() as Promise<{ models: ModelSummary[]; mode: string; note?: string }>)
        .then((data) => {
          setResults(data.models ?? []);
          setMode(data.mode);
          setNote(data.note);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Search is ranked across every modality, so the tab still filters it — that
  // keeps rank order within the tab rather than re-querying per tab.
  const source = results ?? catalog ?? [];
  const inTab = useMemo(() => source.filter((m) => m.modality === tab), [source, tab]);

  // Facets come from the tab, not the whole catalog: offering "lyrics" while
  // looking at image models is a filter that can only ever return nothing.
  const facets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const model of inTab) {
      for (const capability of model.capabilities) {
        counts.set(capability, (counts.get(capability) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [inTab]);

  // ANDed. Selecting image-to-video and synced-audio should mean both, which
  // is the whole point — an OR would just re-create the ranked list.
  const visible = useMemo(
    () =>
      capabilities.length === 0
        ? inTab
        : inTab.filter((model) => capabilities.every((c) => model.capabilities.includes(c))),
    [inTab, capabilities],
  );
  const enabledCount = visible.filter((m) => m.enabled).length;
  const loading = catalog === null;

  async function toggle(id: string, enabled: boolean) {
    // Both lists hold the same model, so an optimistic flip has to touch both
    // or the row snaps back when a search clears.
    const flip = (list: ModelSummary[] | null) =>
      list?.map((m) => (m.id === id ? { ...m, enabled } : m)) ?? null;
    setCatalog(flip);
    setResults(flip);

    await fetch('/api/models', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, enabled }),
    });
  }

  return (
    <>
      <PageHeader
        breadcrumb={['Sequel', 'Models']}
        title="Models"
        meta={
          <>
            {visible.length} {tab} model{visible.length === 1 ? '' : 's'}
            {capabilities.length > 0 && ` of ${inTab.length}`} · {enabledCount} enabled ·
            disabled models are hidden from search and refused by runs
          </>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <Segmented
          value={tab}
          options={TABS}
          onChange={(next) => {
            setTab(next);
            setCapabilities([]);
          }}
        />

        <div className="flex flex-1 items-center gap-2.5 rounded-full bg-[var(--color-card)] px-4 py-2">
          <SearchIcon className="text-[var(--color-dim)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by use case — “product photo on white”, “cheap video with audio”"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--color-dim)]"
          />
        </div>

        <CapabilityFilter
          available={facets}
          selected={capabilities}
          onChange={setCapabilities}
        />
      </div>

      {query.trim() && (
        <div className="mb-4 text-[12px] text-[var(--color-dim)]">
          {searching
            ? 'Searching…'
            : `Ranked by ${mode === 'hybrid' ? 'embeddings + keywords' : 'keywords only'}`}
          {note ? ` · ${note}` : ''}
        </div>
      )}

      {loading ? (
        <Card className="px-5 py-14 text-center text-[13px] text-[var(--color-muted)]">
          Loading…
        </Card>
      ) : visible.length === 0 ? (
        <Card className="px-5 py-14 text-center text-[13px] text-[var(--color-muted)]">
          No {tab} models match{capabilities.length > 0 ? ' those filters' : ' that search'}.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-6 border-b border-[var(--color-line)] px-5 py-3 text-[12px] font-medium text-[var(--color-dim)]">
            <div className="flex-1">Model</div>
            <div className="w-[300px]">Capabilities</div>
            <div className="w-[170px] text-right">Price</div>
            <div className="w-[38px]" />
          </div>

          {visible.map((model, index) => (
            <div
              key={model.id}
              // The description is the one thing the denser layout gives up, so
              // it stays reachable on hover rather than being dropped outright.
              title={model.description}
              className={[
                'flex items-center gap-6 px-5 py-3.5 transition-colors hover:bg-[var(--color-card-hover)]',
                index > 0 ? 'border-t border-[var(--color-line)]' : '',
                model.enabled ? '' : 'opacity-45',
              ].join(' ')}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ProviderTile provider={model.provider} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium">{model.name}</span>
                    {model.score !== undefined && (
                      <span className="nums shrink-0 text-[11px] text-[var(--color-dim)]">
                        {model.score.toFixed(3)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[12px] text-[var(--color-dim)]">
                      {PROVIDER_LABEL[model.provider] ?? model.provider}
                    </span>
                    {model.requiresByok && (
                      <span className="rounded-[4px] bg-[color-mix(in_srgb,var(--color-pink)_16%,transparent)] px-1.5 py-[1px] text-[10px] font-medium uppercase tracking-wide text-[var(--color-pink)]">
                        byok
                      </span>
                    )}
                    {model.async && (
                      <span className="rounded-[4px] bg-[var(--color-card-hover)] px-1.5 py-[1px] text-[10px] font-medium uppercase tracking-wide text-[var(--color-dim)]">
                        async
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-[300px]">
                <CapabilityPills capabilities={model.capabilities} />
              </div>

              <div className="w-[170px] text-right">
                <Price model={model} />
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={model.enabled}
                aria-label={`${model.enabled ? 'Disable' : 'Enable'} ${model.name}`}
                onClick={() => void toggle(model.id, !model.enabled)}
                className={[
                  'relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors',
                  model.enabled ? 'bg-white' : 'bg-[#333333]',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-[3px] h-4 w-4 rounded-full transition-all',
                    model.enabled ? 'left-[19px] bg-[#0a0a0a]' : 'left-[3px] bg-[#8f8f8f]',
                  ].join(' ')}
                />
              </button>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
