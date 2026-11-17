import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/auth/onboarding-form';
import { homePath, listOrganizations, requireSession } from '@/lib/session';

export const metadata = { title: 'Welcome — Sequel' };
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await requireSession();
  if (session.user.onboardedAt) redirect(await homePath());

  /*
   * Someone who arrived through an invitation already has an organization by
   * the time they get here. Asking them to name one would create a second,
   * empty org and drop them into it instead of the team that invited them.
   */
  const existing = await listOrganizations();
  const joined = existing[0];

  return (
    <OnboardingForm
      name={session.user.name ?? ''}
      joinedOrganization={joined ? joined.name : null}
      // Most people sign up with a work address, so the domain is a better
      // first guess at the org name than an empty box.
      suggestedOrg={suggestOrgName(session.user.email)}
    />
  );
}

function suggestOrgName(email: string): string {
  const domain = email.split('@')[1] ?? '';
  const label = domain.split('.')[0] ?? '';
  const generic = ['gmail', 'outlook', 'hotmail', 'yahoo', 'icloud', 'proton', 'protonmail'];
  if (!label || generic.includes(label)) return '';
  return label.charAt(0).toUpperCase() + label.slice(1);
}
