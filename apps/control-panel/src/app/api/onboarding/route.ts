import { randomSuffix } from '@sequel/core/ids';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Finishes signup: creates the person's first organization and records the two
 * answers onboarding asks for.
 *
 * `onboardedAt` is written last and on purpose. It is the flag every private
 * page checks, so if org creation fails the person lands back on onboarding
 * rather than on a dashboard with no organization behind it.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    organization?: string;
    jobRole?: string;
    useCase?: string;
  } | null;

  const auth = await getAuth();
  const requestHeaders = await headers();

  /*
   * An invited user already belongs to an organization, so creating one here
   * would strand them in an empty org of their own. Membership, not the
   * request body, decides — a client that sends a name anyway is ignored.
   */
  const existing = await auth.api.listOrganizations({ headers: requestHeaders });

  if (existing.length === 0) {
    const name = body?.organization?.trim();
    if (!name) return Response.json({ error: 'Organisation name is required' }, { status: 400 });

    try {
      await auth.api.createOrganization({
        headers: requestHeaders,
        body: { name, slug: await uniqueSlug(auth, name) },
      });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Could not create the organisation' },
        { status: 400 },
      );
    }
  } else if (!(await getSession())?.session.activeOrganizationId) {
    // Accepting an invitation does not set the active organization, so the
    // dashboard would have nothing to scope to on first load.
    await auth.api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: existing[0]!.id },
    });
  }

  // Written through the internal adapter rather than auth.api.updateUser: these
  // three fields are declared `input: false` so nobody can PATCH their own
  // `onboardedAt` and skip this screen. Server-set means server-written.
  const ctx = await auth.$context;
  await ctx.internalAdapter.updateUser(session.user.id, {
    jobRole: body?.jobRole ?? null,
    useCase: body?.useCase ?? null,
    onboardedAt: new Date().toISOString(),
  });

  return Response.json({ ok: true });
}

/**
 * Slugs are unique across every organization, so two people onboarding from
 * the same company would collide. Suffix rather than reject: the name is theirs
 * to fix later in settings, and failing signup over a slug is absurd.
 */
async function uniqueSlug(auth: Awaited<ReturnType<typeof getAuth>>, name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org';

  for (const candidate of [base, `${base}-${randomSuffix(6).toLowerCase()}`]) {
    const { status } = await auth.api.checkOrganizationSlug({ body: { slug: candidate } });
    if (status) return candidate;
  }
  return `${base}-${randomSuffix(10).toLowerCase()}`;
}
