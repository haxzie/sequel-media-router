'use client';

import { BuildingIcon, KeyIcon, PageHeader, Tabs, UsersIcon } from '@sequel/ui';
import { useState } from 'react';
import type { InviteView, MemberView } from '../team/team-manager';
import { TeamManager } from '../team/team-manager';
import { ApiKeysPanel, type ApiKeyView } from './api-keys-panel';
import { OrganisationPanel } from './organisation-panel';

type Tab = 'members' | 'keys' | 'organisation';

const TABS = [
  { value: 'members' as const, label: 'Members', icon: UsersIcon },
  { value: 'keys' as const, label: 'API Keys', icon: KeyIcon },
  { value: 'organisation' as const, label: 'Organisation', icon: BuildingIcon },
];

export function SettingsPanels({
  organization,
  viewerRole,
  viewerUserId,
  members,
  invitations,
  apiKeys,
}: {
  organization: { id: string; name: string; slug: string };
  viewerRole: string;
  viewerUserId: string;
  members: MemberView[];
  invitations: InviteView[];
  apiKeys: ApiKeyView[];
}) {
  const [tab, setTab] = useState<Tab>('members');

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'Settings']}
        title="Settings"
        meta={<>{organization.name}</>}
      />

      <Tabs value={tab} options={TABS} onChange={setTab} />

      <div className="mt-6">
        {tab === 'members' && (
          <TeamManager
            organization={organization}
            viewerRole={viewerRole}
            viewerUserId={viewerUserId}
            members={members}
            invitations={invitations}
          />
        )}
        {tab === 'keys' && <ApiKeysPanel keys={apiKeys} />}
        {tab === 'organisation' && (
          <OrganisationPanel organization={organization} viewerRole={viewerRole} />
        )}
      </div>
    </div>
  );
}
