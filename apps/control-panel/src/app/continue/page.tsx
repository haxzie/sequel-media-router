import { redirect } from 'next/navigation';
import { homePath, requireSession } from '@/lib/session';

/**
 * Where a signed-in person is sent when the caller cannot know where that is.
 *
 * '/' used to answer this: it read the session and redirected members to
 * their dashboard. It is a static marketing page now, so everything that
 * pointed there — finishing onboarding, accepting an invitation, an auth
 * callback — dropped people onto the landing page instead of into their
 * team.
 *
 * Resolving it needs the session and the membership list, so it cannot be a
 * literal in a client component. This route is that lookup, as a URL: no
 * markup, one redirect, and the only place that knows the rule.
 */
export const dynamic = 'force-dynamic';

export default async function ContinuePage() {
  const session = await requireSession();

  // Onboarding is the only thing that can give someone an organisation, so
  // an unfinished account goes there however it arrived here.
  if (!session.user.onboardedAt) redirect('/onboarding');

  redirect(await homePath());
}
