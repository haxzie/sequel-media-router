import { Sidebar } from '@/components/sidebar';
import { getActiveOrganization, listOrganizations, requireOnboarded } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * The signed-in shell, and the only gate on the dashboard.
 *
 * The check lives here rather than in middleware because middleware runs on the
 * edge runtime with no D1 binding — the session simply cannot be read there.
 * Every page in this group is a server component, so one await covers them all.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOnboarded();
  const [organizations, active] = await Promise.all([
    listOrganizations(),
    getActiveOrganization(),
  ]);

  return (
    <div className="flex min-h-screen items-start">
      <Sidebar
        user={{
          name: session.user.name || session.user.email,
          email: session.user.email,
          image: session.user.image ?? null,
        }}
        organizations={organizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
        }))}
        activeOrganizationId={active?.id ?? null}
      />
      <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
