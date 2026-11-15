import { PageHeader } from '@sequel/ui';
import type { InviteView, MemberView } from '../team/team-manager';
import { TeamManager } from '../team/team-manager';
import { ApiKeysPanel, type ApiKeyView } from './api-keys-panel';
import { OrganisationPanel } from './organisation-panel';
import { SettingsTabs } from './settings-tabs';
import { settingsTabLabel, type SettingsTab } from './tabs';

/**
 * A server component now: the active tab comes from the route rather than from
 * state, so there is nothing here that needs the client.
 */
export function SettingsPanels({
  tab,
  organization,
  viewerRole,
  viewerUserId,
  members,
  invitations,
  apiKeys,
}: {
  tab: SettingsTab;
  organization: { id: string; name: string; slug: string };
  viewerRole: string;
  viewerUserId: string;
  members: MemberView[];
  invitations: InviteView[];
  apiKeys: ApiKeyView[];
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'Settings', settingsTabLabel(tab)]}
        title="Settings"
        meta={<>{organization.name}</>}
      />

      <SettingsTabs active={tab} />

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
