'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActivityIcon, HomeIcon, LayersIcon } from './icons';
import { UsageCard } from './usage-card';

const NAV = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/models', label: 'Models', icon: LayersIcon },
  { href: '/tasks', label: 'Tasks', icon: ActivityIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  // Sticky full-height: the usage card must stay in view however long the page is.
  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col justify-between bg-[var(--color-surface)] px-4 py-5">
      <div className="min-h-0 overflow-y-auto">
        {/* Workspace header */}
        <div className="flex items-center gap-3 px-2 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a0a0a]">
            <span className="text-[15px] font-semibold">F</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-tight">Forge</div>
            <div className="truncate text-[12px] text-[var(--color-dim)]">Composio Instant</div>
          </div>
        </div>

        <div className="mb-4 h-px bg-[var(--color-line)]" />

        <nav className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-xl px-2.5 py-2 text-[14px] transition-colors',
                  active
                    ? 'bg-[var(--color-card)] text-[var(--color-text)]'
                    : 'text-[var(--color-muted)] hover:bg-white/4 hover:text-[var(--color-text)]',
                ].join(' ')}
              >
                <Icon />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <UsageCard />
    </aside>
  );
}
