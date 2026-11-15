import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Every Better Auth endpoint — sign-in, callbacks, session, organization,
 * invitations. The handler is resolved per request because the auth instance
 * depends on a D1 binding that only exists inside one.
 */
async function handler(request: Request) {
  const auth = await getAuth();
  return auth.handler(request);
}

export { handler as GET, handler as POST };
