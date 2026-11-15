import { headers } from 'next/headers';
import { resolveActor } from '@/lib/actor';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Members of the caller's active organisation, for filter controls. */
export async function GET(request: Request) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ members: [] });

  const auth = await getAuth();
  const org = await auth.api
    .getFullOrganization({
      headers: await headers(),
      query: { organizationId: actor.organizationId },
    })
    .catch(() => null);

  return Response.json({
    members: (org?.members ?? []).map((member) => ({
      userId: member.userId,
      name: member.user.name || member.user.email,
      image: member.user.image ?? null,
    })),
  });
}
