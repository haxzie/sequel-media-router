import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { SettingsPanels } from '@/components/settings/settings-panels';
import { isSettingsTab, settingsTabLabel } from '@/components/settings/tabs';
import { getAuth } from '@/lib/auth';
import { getActiveOrganization, requireOnboarded } from '@/lib/session';
import { getWallet } from '@/lib/wallet';

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

  /*
   * Every key in the organisation, not just the viewer's own.
   *
   * listApiKeys is session-scoped, which would hide a teammate's key from the
   * person trying to work out what is calling the API. Read through the
   * adapter instead and resolve each owner against the member list already
   * loaded above.
   */
  const keys = tab === 'keys' ? await listOrganizationKeys(auth, org.members) : [];

  const wallet = tab === 'billing' ? await getWallet(org.id) : null;

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
      apiKeys={keys}
      wallet={
        wallet
          ? {
              availableUsd: wallet.availableUsd,
              spentUsd: wallet.spentUsd,
              credits: wallet.credits.map((credit) => {
                const member = org.members.find((m) => m.userId === credit.createdByUserId);
                return {
                  id: credit.id,
                  amountUsd: credit.amountUsd,
                  platformFeeUsd: credit.platformFeeUsd,
                  taxUsd: credit.taxUsd,
                  totalUsd: credit.totalUsd,
                  paymentMethod: credit.paymentMethod,
                  source: credit.source,
                  createdAt: credit.createdAt,
                  createdBy: member
                    ? {
                        name: member.user.name || member.user.email,
                        image: member.user.image ?? null,
                      }
                    : null,
                };
              }),
            }
          : null
      }
    />
  );
}

interface KeyRow {
  id: string;
  name: string | null;
  start: string | null;
  prefix: string | null;
  enabled: boolean | null;
  referenceId: string;
  createdAt: string | Date;
  lastRequest: string | Date | null;
}

type Member = { userId: string; user: { name?: string | null; email: string; image?: string | null } };

async function listOrganizationKeys(
  auth: Awaited<ReturnType<typeof getAuth>>,
  members: Member[],
) {
  const ctx = await auth.$context;
  const owners = new Set(members.map((member) => member.userId));

  // The adapter types findMany from the model name, which here resolves to the
  // plugin's full ApiKey shape; only these columns are read.
  const rows = (await ctx.adapter
    .findMany({ model: 'apikey', limit: 200 })
    .catch(() => [])) as unknown as KeyRow[];

  return rows
    .filter((row) => owners.has(row.referenceId))
    .map((row) => {
      const member = members.find((entry) => entry.userId === row.referenceId);
      return {
        id: row.id,
        name: row.name ?? 'Untitled key',
        start: row.start ?? null,
        prefix: row.prefix ?? null,
        enabled: row.enabled ?? true,
        createdAt: String(row.createdAt),
        lastRequest: row.lastRequest ? String(row.lastRequest) : null,
        createdBy: member
          ? {
              userId: member.userId,
              name: member.user.name || member.user.email,
              email: member.user.email,
              image: member.user.image ?? null,
            }
          : null,
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
