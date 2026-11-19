import { Clause, PageShell } from '@/components/landing/page-shell';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Contact — Sequel',
  description: 'How to reach Sequel: support, model requests, partnerships and security reports.',
  alternates: { canonical: '/contact' },
};

/* One inbox, read by the people who build it. Listing four addresses that all
   forward to the same place would be theatre. */
const REASONS = [
  {
    title: 'Support',
    body: 'A run that failed, a bill that looks wrong, a client that will not connect. Include the task id if you have one — it is the fastest thing to trace.',
  },
  {
    title: 'Model requests',
    body: 'A model you want in the catalogue, or a capability the current ones do not cover. Tell us what you are trying to make.',
  },
  {
    title: 'Partnerships',
    body: 'Providers, platforms and anyone who wants their models reachable from every agent at once.',
  },
  {
    title: 'Security',
    body: 'Report a vulnerability and we will confirm receipt. Please give us a reasonable window to fix it before disclosing.',
  },
];

export default function ContactPage() {
  return (
    <PageShell lead="Contact" tail={CONTACT_EMAIL}>
      <Clause id="email" title="Write to us">
        <p>
          Everything goes to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> — support, model requests,
          partnerships and security reports alike.
        </p>
      </Clause>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {REASONS.map((reason) => (
          <div
            key={reason.title}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <div className="text-[14.5px] text-[var(--color-text)]">{reason.title}</div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
              {reason.body}
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
