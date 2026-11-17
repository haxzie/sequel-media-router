import { formatUsd } from '@sequel/core/pricing';
import { allModels, audioModels, imageModels, videoModels } from '@sequel/models';
import Link from 'next/link';
import { InstallButton } from '@/components/landing/install-button';
import { baseUrl } from '@/lib/forge';
import { getSession } from '@/lib/session';

export const metadata = {
  title: 'Sequel — give your agent image, video and audio',
  description:
    'Image, video and audio models behind one MCP server. Your agent searches the catalogue, reads the schema, and generates. One connection, one bill, every run attributed.',
};

export const dynamic = 'force-dynamic';

/*
 * Counts come from the catalogue itself.
 *
 * A marketing page that says twenty while the registry holds nineteen is the
 * easiest claim in the world to falsify, and the only person who checks is
 * the one deciding whether to trust the rest of it.
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

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <span className="text-[15px] font-medium tracking-tight">Sequel</span>
        <nav className="flex items-center gap-5 text-[14px] text-[var(--color-muted)]">
          <a href="#models" className="transition-colors hover:text-[var(--color-text)]">
            Models
          </a>
          <a href="#api" className="transition-colors hover:text-[var(--color-text)]">
            API
          </a>
          <Link href="/login" className="transition-colors hover:text-[var(--color-text)]">
            {session ? 'Dashboard' : 'Sign in'}
          </Link>
        </nav>
      </header>

      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
        <div>
          <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] font-medium leading-[1.05] tracking-tight">
            Give your agent image, video and audio.
          </h1>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[var(--color-muted)]">
            {COUNTS.all} models behind one MCP server. Your agent searches the catalogue, reads
            the schema, and generates — nothing to integrate. One connection, one bill, every run
            attributed.
          </p>

          <div className="mt-8 max-w-[480px]">
            <InstallButton url={url} />
            <p className="mt-3 text-[13px] text-[var(--color-dim)]">
              No key to paste. Your client opens a browser and you approve it there.
            </p>
          </div>
        </div>

        <Trace />
      </section>

      <Section
        eyebrow="How it works"
        title="Three calls, and none of them are yours to write."
        lead="Your agent discovers what exists, learns the exact shape of it, and runs it. You asked for a picture."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Step
            n="1"
            call="search_models"
            body="Describe the job, not the model. Semantic search over the catalogue returns what fits, with price and latency."
          />
          <Step
            n="2"
            call="get_model_schemas"
            body="The exact parameter names for the model it picked, so it never has to guess at a field."
          />
          <Step
            n="3"
            call="run_models"
            body="Generate. One at a time, or a batch in parallel. Cost comes back with the result."
          />
        </div>
      </Section>

      <Section
        id="models"
        eyebrow="The catalogue"
        title={`${COUNTS.all} models, one connection.`}
        lead={`${COUNTS.image} image, ${COUNTS.video} video, ${COUNTS.audio} audio. Published prices, no markup added on top.`}
      >
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          {allModels.slice(0, 10).map((model, index) => (
            <div
              key={model.id}
              className={`flex items-center gap-4 px-5 py-3 ${
                index > 0 ? 'border-t border-[var(--color-line)]' : ''
              }`}
            >
              <span className="w-14 shrink-0 text-[11px] uppercase tracking-wide text-[var(--color-dim)]">
                {model.modality}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px]">{model.name}</span>
              <span className="hidden shrink-0 font-mono text-[12px] text-[var(--color-dim)] sm:block">
                {model.provider}
              </span>
              <span className="nums w-28 shrink-0 text-right font-mono text-[12px] text-[var(--color-muted)]">
                {model.rates[0] ? `${formatUsd(model.rates[0].usd)}/${model.rates[0].unit}` : '—'}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-[var(--color-dim)]">
          …and {COUNTS.all - 10} more. Your agent searches these; you never pick from a list.
        </p>
      </Section>

      <Section
        eyebrow="Why not just use the provider"
        title="A provider key generates. It doesn't do the rest."
        lead="The part that takes a week is never the generating."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Fact
            title="One bill"
            body="Every modality and every provider on one balance, priced per run at published rates."
          />
          <Fact
            title="Every run attributed"
            body="Who ran it, from which client, through which credential — a session, a key, or an OAuth connection."
          />
          <Fact
            title="Webhooks"
            body="Video is asynchronous. Get told when it lands instead of polling for it."
          />
          <Fact
            title="Teams, not accounts"
            body="Runs, keys and spend scoped to a team, so a shared key is not the only option."
          />
        </div>
      </Section>

      <Section
        id="api"
        eyebrow="Not using an agent?"
        title="There's a plain HTTP API too."
        lead="The same catalogue and the same billing, without MCP in the middle."
      >
        <pre className="scroll-area overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] p-5 font-mono text-[12.5px] leading-[1.7] text-[var(--color-muted)]">
{`curl ${url.replace('/api/mcp', '/api/run')} \\
  -H "authorization: Bearer sk_sequel_..." \\
  -d '{"model":"@cf/black-forest-labs/flux-1-schnell",
       "input":{"prompt":"a brass telescope on a desk"}}'`}
        </pre>
      </Section>

      <section className="mt-20 rounded-3xl border border-[var(--color-line)] px-8 py-14 text-center">
        <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium tracking-tight">
          One command, and your agent can make things.
        </h2>
        <div className="mx-auto mt-8 max-w-[480px]">
          <InstallButton url={url} />
        </div>
      </section>

      <footer className="mt-16 flex items-center justify-between border-t border-[var(--color-line)] pt-6 text-[13px] text-[var(--color-dim)]">
        <span>Sequel</span>
        <Link href="/login" className="transition-colors hover:text-[var(--color-text)]">
          {session ? 'Dashboard' : 'Sign in'}
        </Link>
      </footer>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 py-14">
      <p className="mb-3 text-[12px] uppercase tracking-wide text-[var(--color-dim)]">{eyebrow}</p>
      <h2 className="max-w-[20ch] text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight tracking-tight">
        {title}
      </h2>
      <p className="mb-8 mt-3 max-w-[56ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
        {lead}
      </p>
      {children}
    </section>
  );
}

function Step({ n, call, body }: { n: string; call: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] p-5">
      <span className="text-[12px] text-[var(--color-dim)]">{n}</span>
      <div className="mt-2 font-mono text-[13.5px] text-[var(--color-text)]">{call}</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{body}</p>
    </div>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] p-5">
      <div className="text-[14px] text-[var(--color-text)]">{title}</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{body}</p>
    </div>
  );
}

/**
 * The trace, as the product actually renders it.
 *
 * Static rather than live: it is the one artefact no competitor can show, so
 * it is worth putting above the fold, but a landing page should not be
 * spending someone's balance to decorate itself.
 */
function Trace() {
  const rows = [
    { tool: 'search_models', info: 'Finding a cheap image model', ms: '190ms' },
    { tool: 'get_model_schemas', info: 'Checking the parameters', ms: '19ms' },
    { tool: 'run_models', info: 'Generating the product photo', ms: '1.3s' },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] p-5">
      <div className="mb-4 flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
        <span className="nums">Worked for 12s</span>
        <span className="text-[var(--color-dim)]">·</span>
        <span className="text-[var(--color-dim)]">3 tool calls</span>
      </div>

      <ol className="space-y-3">
        {rows.map((row) => (
          <li key={row.tool} className="flex items-center gap-2.5">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--status-done)]" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-text)]">
              {row.info}
            </span>
            <span className="shrink-0 font-mono text-[12px] text-[var(--color-dim)]">{row.tool}</span>
            <span className="nums shrink-0 font-mono text-[11.5px] text-[var(--color-dim)]">
              {row.ms}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
