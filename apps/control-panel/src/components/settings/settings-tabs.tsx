'use client';

import {
  BuildingIcon,
  CardIcon,
  KeyIcon,
  tabItemClass,
  TabStrip,
  UsersIcon,
  WebhookIcon,
} from '@sequel/ui';
import Link from 'next/link';
import { useTeamPath } from '@/lib/use-team-path';
import { SETTINGS_TABS, type SettingsTab } from './tabs';

const ICONS = {
  members: UsersIcon,
  keys: KeyIcon,
  webhooks: WebhookIcon,
  billing: CardIcon,
  organisation: BuildingIcon,
} as const;

/**
 * Links, not buttons. The tab is in the URL, so it has to survive a reload, a
 * copied link and the back button — none of which a click handler gives you.
 */
export function SettingsTabs({ active }: { active: SettingsTab }) {
  const path = useTeamPath();

  return (
    <TabStrip>
      {SETTINGS_TABS.map((tab) => {
        const Icon = ICONS[tab.value];
        return (
          <Link
            key={tab.value}
            href={path(`/settings/${tab.value}`)}
            aria-current={tab.value === active ? 'page' : undefined}
            className={tabItemClass(tab.value === active)}
          >
            <Icon />
            {tab.label}
          </Link>
        );
      })}
    </TabStrip>
  );
}
