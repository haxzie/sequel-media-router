'use client';

import { useEffect, useMemo, useState } from 'react';
import { SearchIcon } from './icons';
import { Badge, Card, PageHeader, Segmented } from './ui';

type Modality = 'image' | 'video' | 'audio';

interface ModelSummary {
  id: string;
  name: string;
  provider: string;
  modality: Modality;
  description: string;
  capabilities: string[];
  tags: string[];
  price: string;
  etaSeconds: number;
  async: boolean;
  enabled: boolean;
  score?: number;
}

const TABS: Array<{ value: Modality; label: string }> = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
];

export function ModelBrowser() {
  const [tab, setTab] = useState<Modality>('image');
  const [query, setQuery] = useState('');
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [mode, setMode] = useState('all');
  const [note, setNote] = useState<string | undefined>();
  const [busy, setBusy] = useState(true);

  // Debounced: each keystroke would otherwise fire an embedding call.
  useEffect(() => {
    const handle = setTimeout(() => {
      setBusy(true);
      const params = new URLSearchParams({ type: tab });
      if (query.trim()) params.set('q', query.trim());
      fetch(`/api/models?${params}`)
        .then((r) => r.json())
        .then((data: { models: ModelSummary[]; mode: string; note?: string }) => {
          setModels(data.models ?? []);
          setMode(data.mode);
          setNote(data.note);
        })
        .finally(() => setBusy(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [tab, query]);

  const visible = useMemo(() => models.filter((m) => m.modality === tab), [models, tab]);
  const enabledCount = visible.filter((m) => m.enabled).length;

  async function toggle(id: string, enabled: boolean) {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, enabled } : m)));
    await fetch('/api/models', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, enabled }),
    });
  }

  return (
    <>
      <PageHeader
        breadcrumb={['Forge', 'Models']}
        title="Models"
        meta={
          <>
            {visible.length} {tab} models · {enabledCount} enabled · disabled models are hidden
            from search and refused by runs
          </>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <Segmented value={tab} options={TABS} onChange={setTab} />

        <div className="flex flex-1 items-center gap-2.5 rounded-full bg-[var(--color-card)] px-4 py-2">
          <SearchIcon className="text-[var(--color-dim)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by use case — “product photo on white”, “cheap video with audio”"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--color-dim)]"
          />
        </div>
      </div>

      {query.trim() && (
        <div className="mb-4 text-[12px] text-[var(--color-dim)]">
          {busy
            ? 'Searching…'
            : `Ranked by ${mode === 'hybrid' ? 'embeddings + keywords' : 'keywords only'}`}
          {note ? ` · ${note}` : ''}
        </div>
      )}

      <div className="space-y-2.5">
        {visible.map((model) => (
          <Card
            key={model.id}
            className={`px-5 py-4 transition-opacity ${model.enabled ? '' : 'opacity-45'}`}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-medium">{model.name}</span>
                  <span className="text-[12px] text-[var(--color-dim)]">{model.provider}</span>
                  {model.async && <Badge tone="outline">async</Badge>}
                  {model.score !== undefined && (
                    <span className="nums text-[11px] text-[var(--color-dim)]">
                      {model.score.toFixed(3)}
                    </span>
                  )}
                </div>

                <code className="mt-1 block font-mono text-[11px] text-[var(--color-dim)]">
                  {model.id}
                </code>

                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--color-muted)]">
                  {model.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {model.capabilities.map((capability) => (
                    <Badge key={capability} tone="sky">
                      {capability}
                    </Badge>
                  ))}
                  {model.tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-3">
                <div className="text-right">
                  <div className="nums text-[13px] font-medium">{model.price}</div>
                  <div className="mt-0.5 text-[12px] text-[var(--color-dim)]">
                    ~{model.etaSeconds}s
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={model.enabled}
                  aria-label={`${model.enabled ? 'Disable' : 'Enable'} ${model.name}`}
                  onClick={() => void toggle(model.id, !model.enabled)}
                  className={[
                    'relative h-[22px] w-[38px] rounded-full transition-colors',
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
            </div>
          </Card>
        ))}

        {visible.length === 0 && !busy && (
          <Card className="px-5 py-14 text-center text-[13px] text-[var(--color-muted)]">
            No {tab} models match that search.
          </Card>
        )}
      </div>
    </>
  );
}
