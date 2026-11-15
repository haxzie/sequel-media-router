import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from './auth';

/**
 * Server-side session access.
 *
 * `requireSession` and `requireOnboarded` are the two gates every private page
 * goes through. They are functions rather than middleware because middleware
 * cannot reach D1 — the session has to be read where the binding exists.
 */
export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

/**
 * A signed-in user who has not finished onboarding has no organization, so
 * every page that reads org-scoped data would break. Send them to finish.
 */
export async function requireOnboarded() {
  const session = await requireSession();
  if (!session.user.onboardedAt) redirect('/onboarding');
  return session;
}

export async function listOrganizations() {
  const auth = await getAuth();
  return auth.api.listOrganizations({ headers: await headers() });
}

export async function getActiveOrganization() {
  const auth = await getAuth();
  const session = await getSession();
  const id = session?.session.activeOrganizationId;
  if (!id) return null;
  return auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: id },
  });
}
