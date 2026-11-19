import Link from 'next/link';
import { Clause, PageShell } from '@/components/landing/page-shell';
import { CONTACT_EMAIL } from '@/lib/contact';

export const metadata = {
  title: 'Terms — Sequel',
  description:
    'The terms of using Sequel: accounts, acceptable use, balances and billing, content ownership and liability.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <PageShell
      lead="Terms of service"
      tail="the agreement behind the connection"
      updated="19 November 2026"
    >
      <Clause id="service" title="1. The service">
        <p>
          Sequel provides access to third-party image, video and audio models through one API and
          MCP server, with a catalogue, cost estimates, a task queue, webhooks and usage records.
          Using it means you accept these terms. If you are agreeing on behalf of a company, you
          confirm you may bind it.
        </p>
      </Clause>

      <Clause id="accounts" title="2. Your account">
        <p>
          Keep your sign-in details and API keys to yourself; anything run with your keys is treated
          as run by you, and you are responsible for what the members of your organisation do with
          it. Tell us promptly if a key leaks and we will help you revoke it.
        </p>
      </Clause>

      <Clause id="use" title="3. Acceptable use">
        <p>Do not use Sequel to generate, store or distribute:</p>
        <p>
          sexual content involving minors; intimate imagery of a real person made or shared without
          their consent; material that impersonates a real person in order to deceive, including
          political deepfakes; content that incites violence or harassment; or anything that
          infringes someone else&rsquo;s rights or breaks the law where you are.
        </p>
        <p>
          Do not probe, overload or circumvent the service, resell access as your own model API
          without a written agreement, or use it in a way that breaches the terms of the provider
          running the model. We may suspend a run, a key or an account to stop harm in progress.
        </p>
      </Clause>

      <Clause id="providers" title="4. The providers behind the models">
        <p>
          Each model is operated by the provider named in the <Link href="/models">catalogue</Link>,
          and that provider&rsquo;s own terms apply to what you send it and what it returns —
          including any restriction on commercial use. Models come and go, and a provider may change
          or withdraw one at any time.
        </p>
      </Clause>

      <Clause id="billing" title="5. Balance and billing">
        <p>
          Sequel is prepaid: you add funds, and each run draws from the balance of the organisation
          that ran it. The figure shown before a run is an estimate; the figure recorded when it
          finishes is what you pay. A run that fails on our side is not charged.
        </p>
        <p>
          Prices for models can change when a provider changes theirs. Balances do not expire while
          the account is open, and unused balance is not transferable between organisations. Taxes
          are added where they apply.
        </p>
      </Clause>

      <Clause id="content" title="6. What you make">
        <p>
          You keep whatever rights you have in the prompts and files you send, and we claim no
          ownership of the assets generated from them. Rights in an output are what the provider
          running the model grants — check the model before you build a business on it.
        </p>
        <p>
          To operate the service we need permission to process, transmit and store your inputs and
          outputs: hand them to the provider, keep them available in your dashboard, and deliver them
          to your webhook. That permission exists for nothing else, and ends when you delete the
          content.
        </p>
      </Clause>

      <Clause id="availability" title="7. Availability">
        <p>
          We aim to keep Sequel up and fast, but it is provided as it is, without a guaranteed uptime
          unless we have agreed one with you in writing. Features marked beta may change or
          disappear.
        </p>
      </Clause>

      <Clause id="termination" title="8. Suspension and ending it">
        <p>
          You can close your account whenever you like. We may suspend or close an account that
          breaches these terms, is used to harm others, or fails to pay. If we close your account
          without cause, we will refund the unused balance.
        </p>
      </Clause>

      <Clause id="liability" title="9. Disclaimers and liability">
        <p>
          Generated media is produced by models, not by people, and may be wrong, offensive or
          unsuitable for your purpose; check anything you publish. To the extent the law allows, we
          exclude implied warranties, and our total liability for any claim is limited to what you
          paid us in the three months before it arose. Neither side is liable for indirect or
          consequential loss.
        </p>
      </Clause>

      <Clause id="changes" title="10. Changes, law and contact">
        <p>
          We may update these terms; material changes will be posted here and dated, and continuing
          to use Sequel after that means you accept them. Any dispute will be handled under the laws
          of the jurisdiction in which Sequel is established, in its courts. Questions:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </Clause>
    </PageShell>
  );
}
