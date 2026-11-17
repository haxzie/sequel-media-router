import { formatUsd } from '@sequel/core/pricing';
import { allModels, audioModels, imageModels, videoModels } from '@sequel/models';
import Link from 'next/link';
import { HeroArtifact } from '@/components/landing/hero-artifact';
import { InstallButton } from '@/components/landing/install-button';
import { Arcs, Wordmark } from '@/components/landing/mark';
import { Nav } from '@/components/landing/nav';
import { TryIt } from '@/components/landing/try-it';
import { Duo, Marker, Pill, Section } from '@/components/landing/parts';
import { baseUrl } from '@/lib/forge';
import { getSession } from '@/lib/session';

export const metadata = {
  title: 'Sequel — media is a tool call now',
  description:
    'Media is a tool call now. Image, video and audio models behind one MCP server — your agent searches the catalogue, reads the schema, and generates. One connection, one bill, every run attributed.',
};

export const dynamic = 'force-dynamic';

/*
 * Counts come from the catalogue itself. A page claiming twenty while the
 * registry holds nineteen is the easiest claim in the world to falsify, and
 * the person who checks is the one deciding whether to trust the rest of it.
 */
const COUNTS = {
  all: allModels.length,
  image: imageModels.length,
  video: videoModels.length,
  audio: audioModels.length,
};

export default async function HomePage() {
  const url = `${baseUrl()}/api/mcp`;
  const session = await getSession();
  const home = session ? '/login' : '/login';

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1180px] px-6">
        <header className="flex items-center justify-between py-5">
          {/* Wordmark and links as one group on the left, the way a product
              nav reads — the links belong to the brand, not to the gap. */}
          <div className="flex items-center gap-8">
            <Wordmark />

            <Nav />
          </div>

          <div className="flex items-center gap-3">
            <Link href={home} className="text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]">
              {session ? 'Dashboard' : 'Sign in'}
            </Link>
            <Pill href="#install">Get started</Pill>
          </div>
        </header>

        {/* Hero. Left-aligned with a long run-up, so the headline has room to
            be the only thing on screen for a moment.

            The arcs are clipped by this box rather than by the headline's own
            section: a quarter circle needs the height of the artifact below it
            to read as one curve, and against the headline alone it stops in
            mid-air. */}
        <div className="relative overflow-hidden">
          {/* The mark, enlarged past the point of being a logo. Three arcs
              enter at the top and leave to the right, holding the empty half
              of the hero without asking to be read. */}
          <Arcs className="pointer-events-none absolute -top-[120px] right-[-170px] hidden h-[860px] w-[860px] text-[var(--color-text)] opacity-[0.07] lg:block" />

          <section className="relative pt-14 sm:pt-20">
            <Duo
              lead="Media is a tool call now."
              tail="Generative media stack for your agents"
              className="text-[clamp(2rem,4.4vw,3rem)]"
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Pill href="#install" faces>
                Add to your agent
              </Pill>
              <Pill href="/docs" tone="ghost">
                Build with Sequel
              </Pill>
            </div>
          </section>

          <section className="relative grid gap-8 pb-20 pt-14 lg:grid-cols-[1.6fr_1fr] lg:items-end">
            <HeroArtifact />

            <div className="pb-2">
              <Duo
                lead="Ship generation today."
                tail={`${COUNTS.all} models, one connection, every run accounted for.`}
                className="text-[clamp(1.35rem,2.4vw,1.75rem)]"
              />

              <p className="mt-6 text-[12px] uppercase tracking-wide text-[var(--color-dim)]">Includes</p>
              <ul className="mt-3 space-y-2 text-[14px] text-[var(--color-muted)]">
                {['Semantic model search', 'Schemas on demand', 'Batch generation', 'Webhooks', 'Per-run attribution'].map(
                  (item) => (
                    <li key={item}>{item}</li>
                  ),
                )}
              </ul>
            </div>
          </section>
        </div>

        <Section id="how">
          <Marker n="01" label="Discover" />
          <Duo
            lead="Your agent finds the model"
            tail="you describe the job, not the catalogue"
            className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
          />
          <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
            Three calls, none of them yours to write. Semantic search returns what fits with price
            and latency, the schema gives exact parameter names, and the run comes back with its
            cost attached.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['search_models', 'Describe the job. Get back what fits, with price and latency.'],
              ['get_model_schemas', 'Exact parameter names, so it never guesses at a field.'],
              ['run_models', 'Generate. One, or a batch in parallel. Cost comes back with it.'],
            ].map(([call, body]) => (
              <div key={call} className="rounded-2xl border border-[var(--color-line)] p-5">
                <div className="font-mono text-[13px] text-[var(--color-text)]">{call}</div>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* The composer, on a plate of the page's own output. It sits here
            rather than higher because the three tool calls above are what it
            replays — the demo is unreadable before you know their names. */}
        <Section id="try">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
            <Marker n="02" label="Try it" />

            <div>
              <Duo
                lead="Type the job"
                tail="and the catalogue picks the model"
                className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
              />
              <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
                No model id, no provider, no parameter names. A sentence goes in and a priced run
                comes back — the same three calls your agent makes.
              </p>
            </div>
          </div>

          <TryIt />
        </Section>

        <Section id="models">
          <Marker n="03" label="Generate" />
          <Duo
            lead={`${COUNTS.all} models, one bill`}
            tail="image, video and audio at published prices"
            className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-4">
            {['01', '02', '03', '04'].map((n) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={n}
                src={`/landing/${n}.jpg`}
                alt=""
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-[var(--color-dim)]">
            Every image on this page was generated by Sequel, with flux-1-schnell.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--color-line)]">
            {allModels.slice(0, 8).map((model, index) => (
              <div
                key={model.id}
                className={`flex items-center gap-4 px-5 py-3 ${
                  index > 0 ? 'border-t border-[var(--color-line)]' : ''
                }`}
              >
                <span className="w-12 shrink-0 text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
                  {model.modality}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px]">{model.name}</span>
                <span className="nums w-32 shrink-0 text-right font-mono text-[12px] text-[var(--color-muted)]">
                  {model.rates[0] ? `${formatUsd(model.rates[0].usd)}/${model.rates[0].unit}` : '—'}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-[var(--color-dim)]">
            {COUNTS.image} image · {COUNTS.video} video · {COUNTS.audio} audio
          </p>
        </Section>

        <Section>
          <Marker n="04" label="Account for it" />
          <Duo
            lead="A provider key generates."
            tail="It does not do any of the rest."
            className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              ['One bill', 'Every modality and provider on one balance, priced per run at published rates.'],
              ['Every run attributed', 'Who ran it, from which client, through a session, a key or an OAuth connection.'],
              ['Webhooks', 'Video is asynchronous. Get told when it lands instead of polling for it.'],
              ['Teams, not accounts', 'Runs, keys and spend scoped to a team, so a shared key is not the only option.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-[var(--color-line)] p-5">
                <div className="text-[14px] text-[var(--color-text)]">{title}</div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="install">
          <Marker n="05" label="Connect" />
          <Duo
            lead="Run it from the agent you already use"
            tail="Claude Code, Cursor, ChatGPT, and anything else over MCP"
            className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
          />
          <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
            One command. Your browser opens to sign in and authorize — there is no API key to copy
            into the agent.
          </p>

          <div className="mt-10 max-w-[560px]">
            <InstallButton url={url} />
          </div>
        </Section>

        <section className="relative overflow-hidden border-t border-[var(--color-line)] py-24">
          {/* Mirrored and entering from the left, so the page is bracketed by
              the mark rather than wearing it twice in the same corner. */}
          <Arcs className="pointer-events-none absolute -bottom-[280px] left-[-240px] hidden h-[720px] w-[720px] -scale-x-100 text-[var(--color-text)] opacity-[0.055] lg:block" />

          <Duo
            lead="One command,"
            tail="and every prompt gets a sequel."
            className="text-[clamp(1.8rem,4vw,2.8rem)]"
          />
          {/* The same pair as the hero: the closing ask should offer both
              doors, not narrow to one. */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Pill href="#install" faces>
              Add to your agent
            </Pill>
            <Pill href="/docs" tone="ghost">
              Build with Sequel
            </Pill>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-[var(--color-line)] py-8 text-[13px] text-[var(--color-dim)]">
          <Wordmark className="text-[var(--color-muted)]" />
          <Link href={home} className="transition-colors hover:text-[var(--color-text)]">
            {session ? 'Dashboard' : 'Sign in'}
          </Link>
        </footer>
      </div>
    </div>
  );
}
