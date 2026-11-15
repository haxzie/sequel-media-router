import { headers } from 'next/headers';
import { SettingsPanels } from '@/components/settings/settings-panels';
import { getAuth } from '@/lib/auth';
import { getActiveOrganization, requireOnboarded } from '@/lib/session';

export const metadata = { title: 'Settings — Sequel' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await requireOnboarded();
  const org = await getActiveOrganization();
  if (!org) return null;

  const me = org.members.find((member) => member.userId === session.user.id);
  const viewerRole = me?.role ?? 'member';
  const canManage = viewerRole === 'owner' || viewerRole === 'admin';

  const auth = await getAuth();
  const requestHeaders = await headers();

  /*
   * Better Auth throws for a plain member listing invitations rather than
   * returning an empty list, which took the whole page down. Members have no
   * business seeing pending invites anyway, so don't ask — and still catch,
   * because the permission model is the plugin's to change, not ours.
   */
  const invitations = canManage
    ? await auth.api
        .listInvitations({ headers: requestHeaders, query: { organizationId: org.id } })
        .catch(() => [])
    : [];

  // Keys belong to the person who made them, so this is the viewer's own list.
  // The endpoint returns a paginated envelope, not a bare array.
  const keyPage = await auth.api
    .listApiKeys({ headers: requestHeaders })
    .catch(() => ({ apiKeys: [] }));
  const keys = 'apiKeys' in keyPage ? keyPage.apiKeys : [];

  return (
    <SettingsPanels
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
      apiKeys={keys.map((key) => ({
        id: key.id,
        name: key.name ?? 'Untitled key',
        start: key.start ?? null,
        prefix: key.prefix ?? null,
        enabled: key.enabled ?? true,
        createdAt: String(key.createdAt),
        lastRequest: key.lastRequest ? String(key.lastRequest) : null,
      }))}
    />
  );
}
