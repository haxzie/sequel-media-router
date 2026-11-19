'use client';

import {
  Avatar,
  ChartIcon,
  LayersIcon,
  McpIcon,
  PlusIcon,
  SettingsIcon,
  TasksIcon,
} from '@sequel/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { teamPath } from '@/lib/team-path';
import { OrgSwitcher } from './org-switcher';
import { UserMenu } from './user-menu';
import { UsageCard } from './usage-card';

/** Paths relative to the team, since every one of these lives under it. */
const NAV = [
  { path: '', label: 'Create', icon: PlusIcon },
  { path: '/mcp', label: 'MCP Server', icon: McpIcon },
  { path: '/models', label: 'Models', icon: LayersIcon },
  { path: '/tasks', label: 'Tasks', icon: TasksIcon },
  { path: '/usage', label: 'Usage', icon: ChartIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export interface SidebarUser {
  name: string;
  email: string;
  image: string | null;
}

export interface SidebarOrg {
  id: string;
  name: string;
  slug: string;
}

export function Sidebar({
  team,
  user,
  organizations,
  activeOrganizationId,
}: {
  /** Slug of the team in the URL. Every nav link hangs off it. */
  team: string;
  user: SidebarUser;
  organizations: SidebarOrg[];
  activeOrganizationId: string | null;
}) {
  const pathname = usePathname();

  // Sticky full-height: the usage card must stay in view however long the page is.
  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col justify-between bg-[var(--color-surface)] px-4 py-5">
      <div className="scroll-area min-h-0 overflow-y-auto">
        <OrgSwitcher organizations={organizations} activeId={activeOrganizationId} />

        <div className="my-4 h-px bg-[var(--color-line)]" />

        <nav className="space-y-0.5">
          {NAV.map((item) => {
            const href = teamPath(team, item.path);
            // Settings lives under /settings/<tab>, so an exact match would
            // unlight the item the moment you land on one. Create is the
            // exception: the team root prefixes every path under it, so it
            // needs an exact match.
            const active = item.path === '' ? pathname === href : pathname.startsWith(href);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={href}
                className={[
                  'nav-item flex items-center gap-3 rounded-xl px-2.5 py-2 text-[14px] transition-colors',
                  active
                    ? 'bg-[var(--color-card)] text-[var(--color-text)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <UsageCard />
        <UserMenu user={user} />
      </div>
    </aside>
  );
}

export { Avatar };
