'use client';

import { Alert, ChoiceGroup, Field, Input, SubmitButton } from '@sequel/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const JOB_ROLES = [
  { value: 'engineer', label: 'Engineer' },
  { value: 'founder', label: 'Founder' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design / creative' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Something else' },
] as const;

const USE_CASES = [
  { value: 'agents', label: 'Agent tooling', description: 'Give an agent media generation' },
  { value: 'product', label: 'In-product feature', description: 'Generation inside an app' },
  { value: 'content', label: 'Content at scale', description: 'Ads, social, catalogue' },
  { value: 'prototyping', label: 'Prototyping', description: 'Trying models out' },
] as const;

/**
 * One screen, three questions. Onboarding exists because the account is created
 * silently on first sign-in, so this is the only place to ask — but it is also
 * the last thing between someone and the product, so it stays short.
 */
export function OnboardingForm({
  name,
  suggestedOrg,
  joinedOrganization,
}: {
  name: string;
  suggestedOrg: string;
  joinedOrganization: string | null;
}) {
  const router = useRouter();
  const [org, setOrg] = useState(suggestedOrg);
  const [jobRole, setJobRole] = useState<string | null>(null);
  const [useCase, setUseCase] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organization: joinedOrganization ? null : org.trim(),
        jobRole,
        useCase,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Could not finish setting up. Try again.');
      setBusy(false);
      return;
    }

    // Replace, not push: onboarding must not be reachable with the back button.
    router.replace('/');
    router.refresh();
  }

  const first = name.trim().split(' ')[0];

  return (
    <div>
      <h1 className="text-[22px] font-medium tracking-tight">
        {first ? `Welcome, ${first}` : 'Welcome'}
      </h1>
      <p className="mt-2 text-[14px] text-[var(--color-muted)]">
        {joinedOrganization
          ? `You have joined ${joinedOrganization}. Two questions, then you are in.`
          : 'Three questions, then you are in.'}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        {!joinedOrganization && (
          <Field label="Organisation" hint="You can rename this later, and invite people to it.">
            <Input
              required
              maxLength={60}
              placeholder="Acme Inc"
              value={org}
              onChange={(event) => setOrg(event.target.value)}
            />
          </Field>
        )}

        <div>
          <div className="mb-1.5 text-[13px] text-[var(--color-muted)]">What do you do?</div>
          <ChoiceGroup columns={2} value={jobRole} options={[...JOB_ROLES]} onChange={setJobRole} />
        </div>

        <div>
          <div className="mb-1.5 text-[13px] text-[var(--color-muted)]">
            What will you use Sequel for?
          </div>
          <ChoiceGroup value={useCase} options={[...USE_CASES]} onChange={setUseCase} />
        </div>

        {error && <Alert>{error}</Alert>}

        <SubmitButton
          full
          busy={busy}
          disabled={(!joinedOrganization && !org.trim()) || !jobRole || !useCase}
        >
          Finish setup
        </SubmitButton>
      </form>
    </div>
  );
}
