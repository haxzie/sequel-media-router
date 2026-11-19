import { formatUsd } from '@sequel/core/pricing';
import { allModels } from '@sequel/models';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { HeroArtifact } from '@/components/landing/hero-artifact';
import { InstallPill } from '@/components/landing/install-modal';
import { Arcs } from '@/components/landing/mark';
import { ModelMarquee } from '@/components/landing/model-marquee';
import { Duo, Pill, Section } from '@/components/landing/parts';
import { Plate } from '@/components/landing/plate';
import { ProviderMark } from '@/components/landing/provider-mark';
import { AuditShot, PayloadShot, PriceShot, TaskShot } from '@/components/landing/shots';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { TryIt } from '@/components/landing/try-it';
import { WalletCard } from '@/components/landing/wallet-card';
import { baseUrl } from '@/lib/forge';

export const metadata = {
  title: 'Sequel — media is a tool call now',
  description:
    'Media is a tool call now. Image, video and audio models behind one MCP server — your agent searches the catalogue, reads the schema, and generates. One connection, one bill, every run attributed.',
};

/* Static: the catalogue is a build-time import and the only per-visitor
   thing on the page, the account link, resolves in the browser. */

/*
 * Counts come from the catalogue itself. A page claiming twenty while the
 * registry holds nineteen is the easiest claim in the world to falsify, and
 * the person who checks is the one deciding whether to trust the rest of it.
 */
const SEARCH_RESULTS = [
  /*
   * Capability first, then price — which is what the copy beside this claims,
   * so the order has to survive someone checking it. Phoenix and Lucid both
   * render legible text and Phoenix is the cheaper of the two, so it leads.
   * FLUX is cheapest of all and sits last, because it cannot do the job.
   */
  '@cf/leonardo/phoenix-1.0',
  '@cf/leonardo/lucid-origin',
  '@cf/black-forest-labs/flux-1-schnell',
]
  .map((id) => allModels.find((model) => model.id === id))
  .filter((model): model is NonNullable<typeof model> => Boolean(model));

/*
 * Three marquee rows, dealt round-robin so each one carries a mix of image,
 * video and audio rather than a row of near-identical speech models.
 */
const MARQUEE_ROWS = [0, 1, 2].map((row) => allModels.filter((_, index) => index % 3 === row));

/**
 * The pricing points, with a drawn mark each.
 *
 * A bullet list of three dots asks the eye to read before it can tell the
 * items apart. These three are different in kind — a wallet, money going
 * in, a figure per run — so each gets the object it is about.
 */
const PRICING_POINTS = [
  {
    title: 'One wallet',
    body: 'Image, video and audio draw from the same balance, whichever model the catalogue picks.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M3 6.5A2.5 2.5 0 015.5 4h8A1.5 1.5 0 0115 5.5V7"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <rect x="3" y="6.5" width="14" height="9.5" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="13.5" cy="11.25" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Nothing to forecast',
    body: 'Add funds when you want them. What you do not spend stays where it is.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 6.8v6.4M6.8 10h6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Costed per run',
    body: 'Every run carries an estimate before it starts and a final figure when it lands.',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M5 3.5h10v13l-2-1.4-1.7 1.4-1.3-1.4-1.3 1.4L7 15.1 5 16.5z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M8 7.5h4M8 10.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

/**
 * One cell of the bento.
 *
 * Apple's product grids work because every card is the same object at
 * different sizes: same radius, same padding, same type ramp, and one idea
 * stated in the title. Width is the only thing that varies, so the grid
 * reads as a system rather than as a row of boxes — which is why the span
 * is passed in and nothing else about a card is configurable.
 *
 * Children are optional and sit at the bottom: the cards that carry a
 * payload use it as evidence for the sentence above it, and the ones that
 * do not are simply shorter.
 */
function Feature({
  title,
  body,
  className = '',
  children,
}: {
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[22px] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-7 ${className}`}
    >
      <h3 className="text-[17.5px] leading-snug tracking-[-0.01em] text-[var(--color-text)]">
        {title}
      </h3>
      <p className="mt-2.5 max-w-[46ch] text-[14px] leading-relaxed text-[var(--color-muted)]">
        {body}
      </p>
      {children ? <div className="mt-auto pt-7">{children}</div> : null}
    </div>
  );
}

export default function HomePage() {
  const url = `${baseUrl()}/mcp`;

  return (
    /* overflow-x-clip, not hidden: the arcs hang past the right edge and must
       not add a scrollbar, and clip does that without making this a scroll
       container, which would break the page's anchor links. */
    <div className="relative min-h-screen overflow-x-clip">
      {/* The mark, enlarged past the point of being a logo: three arcs drop in
          at the top and leave through the right edge. Anchored to the page
          rather than to the hero, so they start where the page does. */}
      <Arcs className="pointer-events-none absolute right-[-15vw] top-0 hidden h-[62vw] w-[62vw] text-[var(--color-text)] opacity-[0.07] lg:block" />

      <SiteHeader />

      <div className="relative mx-auto max-w-[1180px] px-6">
        {/* Hero. Left-aligned with a long run-up, so the headline has room to
            be the only thing on screen for a moment. */}
        <section className="pt-14 sm:pt-20">
          <Duo
            lead="Never pick a model again."
            tail="Generative media stack for your agents"
            className="text-[clamp(2rem,4.4vw,3rem)]"
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InstallPill url={url} />
            <Pill href="/docs" tone="ghost">
              Build with Sequel
            </Pill>
          </div>
        </section>

        <section className="grid gap-8 pb-20 pt-14 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <HeroArtifact />

          <div>
            <Duo
              lead="Ship generation today."
              tail="100+ models, one connection, every run accounted for."
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

        <Section id="how">
          {/* The sentence is the thing to read, so it gets the left half on
              its own. The illustration runs off the right edge of the page
              rather than being shrunk to fit — a card cropped by the window
              reads as a view onto something bigger, which is the point of a
              catalogue this size. */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-6">
            <div>
              <Duo
                lead="One search across 100+ models"
                tail="ranked by usecase, cost and performance"
                className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
              />
              <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
                Describe the job, not the model. Search matches on capability and sorts on
                price, so the cheapest one that can actually do it comes back first.
              </p>
            </div>

            {/* The plate the section below uses, and the crop happens at its
                own right edge rather than the window's — so the card is cut
                off inside the content column, not by the browser. */}
            <Plate className="px-5 py-8 sm:px-7 sm:py-10">
              <div className="flex justify-start">
                <span className="max-w-[88%] rounded-[18px] rounded-bl-md bg-[var(--color-card)] px-4 py-2.5 text-[14px] text-[var(--color-text)]">
                  poster art, the text has to be legible
                </span>
              </div>

              {/* A real query against the real catalogue. The rates are the
                  registry's own, which is the only reason this is worth
                  showing: a made-up ranking would be a screenshot of
                  nothing. */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]/90 backdrop-blur-sm lg:w-[128%]">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3 text-[12px]">
                  <span className="font-mono text-[var(--color-dim)]">search_models</span>
                  <span className="text-[var(--color-dim)]">top 3 of 100+</span>
                </div>

                {SEARCH_RESULTS.map((model, index) => (
                  <div
                    key={model.id}
                    className={`flex items-center gap-3.5 px-5 py-4 ${
                      index > 0 ? 'border-t border-white/[0.07]' : ''
                    }`}
                  >
                    <ProviderMark provider={model.provider} name={model.name} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] text-[var(--color-text)]">
                        {model.name}
                      </span>
                      <span className="nums mt-1 block truncate font-mono text-[12px] text-[var(--color-muted)]">
                        {model.rates[0]
                          ? `${formatUsd(model.rates[0].usd)}/${model.rates[0].unit}`
                          : '—'}
                        <span className="text-[var(--color-dim)]"> · ~{model.etaSeconds}s</span>
                      </span>
                    </span>

                    <span className="hidden shrink-0 text-[12px] text-[var(--color-dim)] sm:block">
                      {model.capabilities.join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </Plate>
          </div>
        </Section>

        {/* The composer, on a plate of the page's own output. It sits here
            rather than higher because the three tool calls above are what it
            replays — the demo is unreadable before you know their names. */}
        <Section id="try">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
            <div>
              <Duo
                lead="Type the job"
                tail="and the catalogue picks the model"
                /* whitespace-nowrap: the second line is the claim, and it
                   reads as two half-thoughts when it wraps. */
                className="whitespace-nowrap text-[clamp(1.35rem,2.7vw,2.1rem)]"
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
          <Duo
            lead="Every frontier model, one integration"
            tail="image, video and audio, priced and metered per run"
            className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-4">
            {/* People, a place and a surface, rather than four still lifes:
                the catalogue is for making anything, and four studio objects
                in a row read as one narrow use case. 01-04 stay where they
                are — the terminal above cites them by prompt. */}
            {['05', '06', '07', '08'].map((n) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={n}
                src={`/landing/${n}.jpg`}
                alt=""
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
            ))}
          </div>
          <div className="mt-10">
            <ModelMarquee rows={MARQUEE_ROWS} />
          </div>

        </Section>

        {/* Video is the hard case, and the one worth explaining: it is the
            only modality that cannot answer inside the request, so the whole
            task-and-webhook apparatus exists for it. Laid out as a bento —
            the lead card carries the payload, the rest carry one idea each. */}
        <Section>
          <Duo
            lead="We built the hard half."
            tail="queues, estimates and webhooks, so you never write them"
            className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
          />
          <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
            Calling a model is one line. The queue, the estimate, the delivery and the audit trail
            are the rest — and they run here, not in your codebase.
          </p>

          <div className="mt-10 grid gap-3 lg:grid-cols-6">
            <Feature
              className="lg:col-span-4"
              title="It answers before a frame exists"
              body="A video run comes back the moment it is accepted, with the model it chose, a task id and what the render will cost. Your agent keeps its turn; the work keeps going without it."
            >
              <PayloadShot
                label="run_models"
                caption="returned in 0.4s"
                frame="w-[108%] h-[206px]"
                json={`{
  "status": "in_progress",
  "task_id": "task_9f2c7a1b",
  "model": "minimax/hailuo-2.3",
  "cost": { "usd": "0.280000", "estimated": true },
  "eta_seconds": 80,
  "input": { "duration": 6, "resolution": "1080p", "fps": 24 },
  "created_at": "2026-02-11T14:02:11.482Z"
}`}
              />
            </Feature>

            <Feature
              className="lg:col-span-2"
              title="Priced before it starts"
              body="The estimate arrives with the task, not with the invoice. Show it, cap it, or refuse the run — all of it before the first second of compute."
            >
              <PriceShot />
            </Feature>

            <Feature
              className="lg:col-span-2"
              title="The webhook brings it back"
              body="A signed event lands on your endpoint when the asset is ready. Nothing polls, nothing sleeps, nothing holds a socket open to wait."
            >
              <PayloadShot
                label="task.completed"
                caption="delivered ~80s later"
                frame="w-[132%] h-[168px]"
                json={`{
  "type": "task.completed",
  "data": {
    "task": {
      "id": "task_9f2c7a1b",
      "status": "completed",
      "assets": [{ "url": "https://cdn.sequel.sh/task_9f2c7a1b/clip.mp4" }]
    }
  }
}`}
              />
            </Feature>

            <Feature
              className="lg:col-span-2"
              title="Durable by id"
              body="A dropped connection costs you a notification, not the render. Redeploy, reconnect, come back tomorrow — the task is still there to fetch."
            >
              <TaskShot />
            </Feature>

            <Feature
              className="lg:col-span-2"
              title="Attributed on arrival"
              body="Who asked, from which client, on which key. A batch of clips arrives as a list you can audit, bill back, or quietly stop."
            >
              <AuditShot />
            </Feature>
          </div>
        </Section>

        {/* Pricing, as the wallet it actually is. The section this replaced
            was a second install prompt — the hero's button now opens the
            same dialog, so the page got the slot back. */}
        <Section id="pricing">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Duo
                lead="Pay as you go."
                tail="one balance, whichever model runs"
                className="text-[clamp(1.6rem,3.2vw,2.3rem)]"
              />
              <ul className="mt-8 space-y-5">
                {PRICING_POINTS.map(({ icon, title, body }) => (
                  <li key={title} className="flex gap-3.5">
                    <span
                      className="mt-[2px] flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-text)]"
                      aria-hidden
                    >
                      {icon}
                    </span>
                    <span>
                      <span className="text-[14.5px] text-[var(--color-text)]">{title}</span>
                      <span className="mt-1 block max-w-[46ch] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
                        {body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <Pill href="/models" tone="ghost">
                  See what runs cost
                </Pill>
              </div>
            </div>

            <WalletCard />
          </div>
        </Section>

        <section className="border-t border-[var(--color-line)] py-24">
          <Duo
            lead="One command,"
            tail="and every prompt gets a sequel."
            className="text-[clamp(1.8rem,4vw,2.8rem)]"
          />
          {/* The same pair as the hero: the closing ask should offer both
              doors, not narrow to one. */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <InstallPill url={url} />
            <Pill href="/docs" tone="ghost">
              Build with Sequel
            </Pill>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
