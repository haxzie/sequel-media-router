import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { SettingsPanels } from '@/components/settings/settings-panels';
import { isSettingsTab, settingsTabLabel } from '@/components/settings/tabs';
import { getAuth } from '@/lib/auth';
import { getActiveOrganization, requireOnboarded } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  return {
    title: isSettingsTab(tab) ? `${settingsTabLabel(tab)} — Settings — Sequel` : 'Settings — Sequel',
  };
}

export default async function SettingsTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!isSettingsTab(tab)) notFound();

  const session = await requireOnboarded();
  const org = await getActiveOrganization();
  if (!org) return null;

  const me = org.members.find((member) => member.userId === session.user.id);
  const viewerRole = me?.role ?? 'member';
  const canManage = viewerRole === 'owner' || viewerRole === 'admin';

  const auth = await getAuth();
  const requestHeaders = await headers();

  /*
   * Each tab only loads what it shows. Before the tabs were routed this page
   * fetched invitations and keys on every visit regardless of which panel was
   * open; now the URL says what is needed.
   */
  const invitations =
    tab === 'members' && canManage
      ? await auth.api
          .listInvitations({ headers: requestHeaders, query: { organizationId: org.id } })
          .catch(() => [])
      : [];

  const keyPage =
    tab === 'keys'
      ? await auth.api.listApiKeys({ headers: requestHeaders }).catch(() => ({ apiKeys: [] }))
      : { apiKeys: [] };
  const keys = 'apiKeys' in keyPage ? keyPage.apiKeys : [];

  return (
    <SettingsPanels
      tab={tab}
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
