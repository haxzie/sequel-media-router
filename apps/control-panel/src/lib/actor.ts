import type { TaskActor } from '@sequel/core';
import { getAuth } from './auth';

/**
 * Who is making this request.
 *
 * Three doors lead to a run — the dashboard's session cookie, an API key, and
 * (once enforcement lands) an OAuth access token — and a task should say which
 * one it came through. Returns null rather than throwing: nothing is gated on
 * attribution yet, so an unauthenticated caller still gets a run, it just
 * carries no name.
 */
export async function resolveActor(request: Request): Promise<TaskActor | null> {
  const auth = await getAuth();
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;

  // An API key is recognised by its prefix, so a bearer token that is not one
  // falls through to the OAuth path rather than being rejected outright.
  if (bearer?.startsWith('sk_sequel_')) {
    const verified = await auth.api
      .verifyApiKey({ body: { key: bearer } })
      .catch(() => null);

    if (!verified?.valid || !verified.key) return null;

    const user = await lookupUser(auth, verified.key.referenceId);
    if (!user) return null;

    return {
      userId: user.id,
      name: user.name || user.email,
      email: user.email,
      image: user.image ?? null,
      via: 'api_key',
      apiKeyId: verified.key.id,
    };
  }

  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  if (!session) return null;

  return {
    userId: session.user.id,
    name: session.user.name || session.user.email,
    email: session.user.email,
    image: session.user.image ?? null,
    via: 'session',
    ...(session.session.activeOrganizationId
      ? { organizationId: session.session.activeOrganizationId }
      : {}),
  };
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

/**
 * Read through the adapter rather than an endpoint: the key's owner is not the
 * caller of any session-bound API, so there is no request to borrow.
 */
async function lookupUser(
  auth: Awaited<ReturnType<typeof getAuth>>,
  userId: string,
): Promise<UserRow | null> {
  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.findUserById(userId).catch(() => null);
  return (user as UserRow | null) ?? null;
}
