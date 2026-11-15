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

/**
 * The organisation the session is scoped to.
 *
 * A fresh session carries no active organisation — only onboarding and the
 * switcher set one — so every returning user arrived with nothing selected and
 * the pages that scope to an org rendered blank. If the session has no active
 * organisation but the user belongs to one, adopt the first and persist it, so
 * this self-corrects instead of needing a visit to the switcher.
 */
export async function getActiveOrganization() {
  const auth = await getAuth();
  const requestHeaders = await headers();
  const session = await getSession();
  if (!session) return null;

  let id = session.session.activeOrganizationId;

  if (!id) {
    const [first] = await auth.api.listOrganizations({ headers: requestHeaders });
    if (!first) return null;
    await auth.api
      .setActiveOrganization({ headers: requestHeaders, body: { organizationId: first.id } })
      .catch(() => undefined);
    id = first.id;
  }

  return auth.api.getFullOrganization({
    headers: requestHeaders,
    query: { organizationId: id },
  });
}
