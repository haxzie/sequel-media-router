'use client';

import { Avatar, CreateIcon, LayersIcon, SettingsIcon, TasksIcon } from '@sequel/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrgSwitcher } from './org-switcher';
import { UserMenu } from './user-menu';
import { UsageCard } from './usage-card';

const NAV = [
  { href: '/', label: 'Create', icon: CreateIcon },
  { href: '/models', label: 'Models', icon: LayersIcon },
  { href: '/tasks', label: 'Tasks', icon: TasksIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
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
  user,
  organizations,
  activeOrganizationId,
}: {
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
            // Settings lives under /settings/<tab>, so an exact match would
            // unlight the item the moment you land on one.
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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
