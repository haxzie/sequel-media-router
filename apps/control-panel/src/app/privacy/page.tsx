import Link from 'next/link';
import { Clause, PageShell } from '@/components/landing/page-shell';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Privacy — Sequel',
  description:
    'What Sequel collects, why, where it goes when a model runs, and how to get it back or have it deleted.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <PageShell
      lead="Privacy"
      tail="what we hold, why, and how to get it back"
      updated="19 November 2026"
    >
      <Clause id="collect" title="What we collect">
        <p>
          <strong>Account details.</strong> Your name, email address and avatar, as supplied by the
          sign-in method you chose, plus the organisations you belong to and your role in them.
        </p>
        <p>
          <strong>Credentials.</strong> API keys are stored hashed; we cannot show you a key again
          after it is issued. Sessions and OAuth grants for connected clients are stored so your
          agent stays connected.
        </p>
        <p>
          <strong>What you send and what comes back.</strong> Prompts, uploaded reference files and
          other inputs, together with the assets generated from them.
        </p>
        <p>
          <strong>Run records.</strong> For every run: the model, the parameters, the estimated and
          final cost, timings, status, and the attribution — which member ran it, from which client,
          on which key.
        </p>
        <p>
          <strong>Billing records.</strong> Top-ups, balances and receipts. Card details are handled
          by our payment processor and never reach our servers.
        </p>
        <p>
          <strong>Technical logs.</strong> Request metadata, IP address, user agent and error traces,
          kept to keep the service up and to investigate abuse.
        </p>
      </Clause>

      <Clause id="why" title="Why we hold it">
        <p>
          To run the generations you ask for, bill them accurately, show you what was spent and by
          whom, keep accounts secure, prevent abuse of the models, and answer you when you write in.
          We do not sell personal data, and we do not use your prompts or generated assets to train
          models.
        </p>
      </Clause>

      <Clause id="providers" title="Where it goes when a model runs">
        <p>
          Sequel does not own the models. When you run one, the prompt and any input files are sent
          to the provider that hosts it, along with the parameters of the run. That provider handles
          the content under its own terms and privacy policy. Each model names its provider in the{' '}
          <Link href="/models">catalogue</Link>, so you can check before you run it.
        </p>
      </Clause>

      <Clause id="processors" title="Who else touches it">
        <p>
          We use service providers to operate Sequel: cloud hosting and object storage, a payment
          processor for top-ups, and email delivery for account messages. They act on our
          instructions and only to provide the service. We disclose data otherwise only where the
          law requires it, or to protect the service and its users from abuse.
        </p>
      </Clause>

      <Clause id="retention" title="How long we keep it">
        <p>
          Generated assets and their run records stay available in your dashboard until you delete
          them. Billing records are kept as long as accounting and tax rules require. Technical logs
          are kept for a limited period and then discarded. Delete an organisation and we remove its
          assets and run data, save for what we must keep for those records.
        </p>
      </Clause>

      <Clause id="security" title="Security">
        <p>
          Traffic is encrypted in transit. Keys are hashed, access is scoped to the organisation that
          owns the data, and every run is attributed so an unexpected one can be traced. No system is
          perfect; if something looks wrong, tell us and we will look the same day.
        </p>
      </Clause>

      <Clause id="rights" title="Your choices">
        <p>
          You can access and export what you have made from the dashboard, correct your account
          details there, revoke keys and connected clients at any time, and delete assets
          individually or close the account entirely. Depending on where you live you may also have
          the right to object to certain processing or to ask for a copy of your data — write to us
          and we will handle it.
        </p>
      </Clause>

      <Clause id="cookies" title="Cookies">
        <p>
          We set a session cookie so you stay signed in, and the cookies our payment processor needs
          to take a payment. There is no advertising or cross-site tracking on this site.
        </p>
      </Clause>

      <Clause id="children" title="Children">
        <p>
          Sequel is not intended for anyone under 16, and we do not knowingly collect their data.
        </p>
      </Clause>

      <Clause id="changes" title="Changes, and how to reach us">
        <p>
          If this policy changes materially we will say so here and date it. Questions, requests and
          complaints: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Clause>
    </PageShell>
  );
}
