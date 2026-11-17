import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { getAuth } from '@/lib/auth';
import { listOrganizations, requireOnboarded } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * The signed-in shell, and the only gate on the dashboard.
 *
 * The check lives here rather than in middleware because middleware runs on the
 * edge runtime with no D1 binding — the session simply cannot be read there.
 * Every page in this group is a server component, so one await covers them all.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ team: string }>;
}) {
  const session = await requireOnboarded();
  const { team } = await params;
  const organizations = await listOrganizations();

  /*
   * The team in the URL decides which team you are in.
   *
   * Not a member, or no such slug, and it is a 404 rather than a redirect to
   * somewhere you can see — the two are indistinguishable from outside, which
   * is what stops the URL being used to find out whether a team exists.
   */
  const active = organizations.find((org) => org.slug === team);
  if (!active) notFound();

  /*
   * Make it the session's active organisation too.
   *
   * Everything downstream — tasks, usage, keys, webhooks — scopes itself by
   * activeOrganizationId, so pointing that at the team named in the path lets
   * all of it stay exactly as it was while the URL becomes the source of
   * truth. Without this, opening /acme in one tab and /beta in another would
   * have both tabs reading whichever was loaded last.
   */
  const auth = await getAuth();
  await auth.api
    .setActiveOrganization({
      headers: await headers(),
      body: { organizationId: active.id },
    })
    .catch(() => undefined);

  return (
    <div className="flex min-h-screen items-start">
      <Sidebar
        team={active.slug}
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
        activeOrganizationId={active.id}
      />
      <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
