'use client';

import { Alert, ChoiceGroup, Field, Input, StepBar, SubmitButton } from '@sequel/ui';
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

type StepId = 'organisation' | 'role' | 'useCase';

/**
 * One question per step.
 *
 * All three on one page meant scrolling past two answered questions to reach
 * the button, and the long use-case list pushed it off screen entirely. A
 * wizard also makes the required-ness obvious: you cannot continue past a
 * question you have not answered, so the submit button is never mysteriously
 * disabled with no indication of why.
 *
 * An invited person already has an organisation, so their wizard is two steps.
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
  const steps: StepId[] = joinedOrganization
    ? ['role', 'useCase']
    : ['organisation', 'role', 'useCase'];

  const [index, setIndex] = useState(0);
  const [org, setOrg] = useState(suggestedOrg);
  const [jobRole, setJobRole] = useState<string | null>(null);
  const [useCase, setUseCase] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[index]!;
  const last = index === steps.length - 1;

  const answered =
    step === 'organisation' ? org.trim().length > 0 : step === 'role' ? jobRole : useCase;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    // Enter on an early step advances rather than submitting half an answer.
    if (!last) {
      if (answered) setIndex(index + 1);
      return;
    }

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
      <StepBar step={index + 1} total={steps.length} />

      <div className="mt-6">
        <h1 className="text-[22px] font-medium tracking-tight">
          {index === 0 ? (first ? `Welcome, ${first}` : 'Welcome') : TITLES[step]}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
          {index === 0 && joinedOrganization
            ? `You're in ${joinedOrganization}. Two quick questions.`
            : SUBTITLES[step]}
        </p>
      </div>

      <form onSubmit={submit} className="mt-7">
        {step === 'organisation' && (
          <Field label="Organisation" hint="You can rename this later, and invite people to it.">
            <Input
              autoFocus
              required
              maxLength={60}
              placeholder="Acme Inc"
              value={org}
              onChange={(event) => setOrg(event.target.value)}
            />
          </Field>
        )}

        {step === 'role' && (
          <ChoiceGroup columns={2} value={jobRole} options={[...JOB_ROLES]} onChange={setJobRole} />
        )}

        {step === 'useCase' && (
          <ChoiceGroup value={useCase} options={[...USE_CASES]} onChange={setUseCase} />
        )}

        {error && <div className="mt-4">{<Alert>{error}</Alert>}</div>}

        <div className="mt-7 flex items-center gap-3">
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              className="rounded-full px-4 py-2.5 text-[14px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              Back
            </button>
          )}
          <div className="flex-1">
            <SubmitButton full busy={busy} disabled={!answered}>
              {last ? 'Finish setup' : 'Continue'}
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}

const TITLES: Record<StepId, string> = {
  organisation: 'Your organisation',
  role: 'What do you do?',
  useCase: 'What will you use Sequel for?',
};

const SUBTITLES: Record<StepId, string> = {
  organisation: 'Everything — models, tasks and spend — belongs to it.',
  role: 'So we know who we are building for.',
  useCase: 'This shapes which models we put in front of you.',
};
