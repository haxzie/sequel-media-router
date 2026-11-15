import { headers } from 'next/headers';
import { TeamManager } from '@/components/team/team-manager';
import { getAuth } from '@/lib/auth';
import { getActiveOrganization, requireOnboarded } from '@/lib/session';

export const metadata = { title: 'Team — Sequel' };
export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await requireOnboarded();
  const org = await getActiveOrganization();
  if (!org) return null;

  const me = org.members.find((member) => member.userId === session.user.id);
  const viewerRole = me?.role ?? 'member';

  /*
   * Better Auth throws for a plain member here rather than returning an empty
   * list, which took the whole page down. Members have no business seeing
   * pending invitations anyway, so don't ask — and still catch, because the
   * permission model is the plugin's to change, not ours.
   */
  const auth = await getAuth();
  const canManage = viewerRole === 'owner' || viewerRole === 'admin';
  const invitations = canManage
    ? await auth.api
        .listInvitations({ headers: await headers(), query: { organizationId: org.id } })
        .catch(() => [])
    : [];

  return (
    <TeamManager
      organization={{ id: org.id, name: org.name, slug: org.slug }}
      viewerRole={viewerRole}
      viewerUserId={session.user.id}
      members={org.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        name: member.user.name || member.user.email,
        email: member.user.email,
        image: member.user.image ?? null,
        createdAt: String(member.createdAt),
      }))}
      invitations={invitations
        .filter((invite) => invite.status === 'pending')
        .map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role ?? 'member',
          expiresAt: String(invite.expiresAt),
        }))}
    />
  );
}
