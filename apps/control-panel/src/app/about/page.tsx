import Link from 'next/link';
import { Clause, PageShell } from '@/components/landing/page-shell';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'About — Sequel',
  description:
    'Why Sequel exists: one connection to the generative media catalogue, so an agent can pick a model instead of being wired to one.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <PageShell lead="About Sequel" tail="one connection to the whole catalogue">
      <Clause id="why" title="Why it exists">
        <p>
          Generative media moved faster than the integrations around it. A team wires an agent to
          one image model, then a video model arrives that is better at the thing they actually
          needed, and the work starts again: another account, another billing relationship,
          another shape of request and another way of waiting for the result.
        </p>
        <p>
          Sequel is the layer that makes that churn somebody else&rsquo;s problem. Your agent
          connects once, describes the job in words, and the catalogue picks the model. When a
          better one lands, it is already there.
        </p>
      </Clause>

      <Clause id="what" title="What it is">
        <p>
          One MCP server in front of the image, video and audio models worth using, with the
          plumbing they need around them — a searchable catalogue with schemas, estimates before a
          run starts, a task queue for the generations that cannot answer inside a request,
          webhooks for delivery, and a record of who ran what, from which client, on which key.
        </p>
        <p>
          Everything the agent can do is in the{' '}
          <Link href="/docs">docs</Link>, and everything it can run is in the{' '}
          <Link href="/models">catalogue</Link>.
        </p>
      </Clause>

      <Clause id="how" title="How we work">
        <p>
          Small, and close to the thing being built. We would rather ship the capability than the
          announcement, which is why the catalogue and the pricing page both read from the same
          registry the server runs on — if it is on the site, it works.
        </p>
      </Clause>

      <Clause id="talk" title="Talk to us">
        <p>
          Questions, a model you want added, or something that broke:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. There is no ticket queue between
          you and the people building it.
        </p>
      </Clause>
    </PageShell>
  );
}
