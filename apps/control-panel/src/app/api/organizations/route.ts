import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { uniqueSlug } from '@/lib/org';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Create an organization from the switcher and make it active.
 *
 * Better Auth sets the new org active on create unless told otherwise, which
 * is what we want here — someone who just made a workspace expects to be in
 * it, not still looking at the old one.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) return Response.json({ error: 'A name is required' }, { status: 400 });

  const auth = await getAuth();
  const requestHeaders = await headers();

  try {
    const organization = await auth.api.createOrganization({
      headers: requestHeaders,
      body: { name, slug: await uniqueSlug(auth, name), keepCurrentActiveOrganization: false },
    });
    return Response.json({ organization });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not create that team' },
      { status: 400 },
    );
  }
}
