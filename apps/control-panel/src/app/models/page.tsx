import { formatUsd } from '@sequel/core/pricing';
import { allModels } from '@sequel/models';
import Link from 'next/link';
import { Arcs } from '@/components/landing/mark';
import { ModelTable, type ModelRow } from '@/components/landing/model-table';
import { InstallPill } from '@/components/landing/install-modal';
import { Duo, Pill } from '@/components/landing/parts';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';

/* Static, for the same reason the docs are: the rows come from the model
   registry, which is an import rather than a query. */

export const metadata = {
  title: 'Models — Sequel',
  description:
    'Every image, video and audio model in the Sequel catalogue, with its capabilities, price and typical latency.',
};

/*
 * Flattened here, not in the table: a model carries a zod schema and a `run`
 * function, and neither survives the trip to a client component.
 */
const ROWS: ModelRow[] = allModels.map((model) => ({
  id: model.alias,
  name: model.name,
  provider: model.provider,
  modality: model.modality,
  description: model.description,
  capabilities: [...model.capabilities],
  rate: model.rates[0] ? `${formatUsd(model.rates[0].usd)}/${model.rates[0].unit}` : '—',
  eta: model.etaSeconds,
  async: Boolean(model.async),
  haystack: [model.name, model.alias, model.provider, model.description, ...model.keywords]
    .join(' ')
    .toLowerCase(),
}));

/**
 * The catalogue, as a page.
 *
 * The home page shows models moving past as proof there are many; this is
 * the one for somebody checking whether the specific thing they need is in
 * there, and what it costs. Every figure is read from the registry, so the
 * page cannot drift from what the API will actually run.
 */
export default function ModelsPage() {

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Arcs className="pointer-events-none absolute right-[-15vw] top-0 hidden h-[62vw] w-[62vw] text-[var(--color-text)] opacity-[0.07] lg:block" />

      <SiteHeader />

      <div className="relative mx-auto max-w-[1180px] px-6">
        <section className="pt-14 sm:pt-20">
          <Duo
            lead="The catalogue"
            tail="every model your agent can reach, and what each one does"
            className="text-[clamp(1.8rem,3.6vw,2.6rem)]"
          />
          <p className="mt-5 max-w-[60ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
            Image, video and audio, behind one connection. Your agent searches this list by use
            case — the filter here is the same catalogue, for when you want to look yourself.
          </p>
        </section>

        <section className="py-12">
          <ModelTable rows={ROWS} />
        </section>

        <section className="border-t border-[var(--color-line)] py-20">
          <Duo
            lead="Pick none of them."
            tail="describe the job and let the catalogue choose"
            className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
          />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InstallPill />
            <Pill href="/docs" tone="ghost">
              Read the docs
            </Pill>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
