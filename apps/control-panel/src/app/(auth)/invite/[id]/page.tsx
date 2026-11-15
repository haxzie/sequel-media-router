import { Alert } from '@sequel/ui';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AcceptInvite } from '@/components/auth/accept-invite';
import { getAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';

export const metadata = { title: 'Invitation — Sequel' };
export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  // Signed out: park the invite id in the callback so the link survives login.
  if (!session) redirect(`/login?invite=${encodeURIComponent(id)}`);

  const auth = await getAuth();
  const invitation = await auth.api
    .getInvitation({ headers: await headers(), query: { id } })
    .catch(() => null);

  if (!invitation) {
    return (
      <div className="text-center">
        <h1 className="text-[20px] font-medium tracking-tight">Invitation not found</h1>
        <p className="mt-2 text-[14px] text-[var(--color-muted)]">
          It may have been cancelled, already used, or expired.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-[13px] text-[var(--color-dim)] transition-colors hover:text-[var(--color-text)]"
        >
          Go to Sequel
        </Link>
      </div>
    );
  }

  /*
   * Better Auth matches an invitation to the signed-in address, so a link
   * opened on the wrong account fails at accept time. Say so up front rather
   * than after a click.
   */
  const mismatched = invitation.email.toLowerCase() !== session.user.email.toLowerCase();

  return (
    <div>
      <h1 className="text-[20px] font-medium tracking-tight">
        Join {invitation.organizationName}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
        You were invited as a <span className="capitalize">{invitation.role ?? 'member'}</span>.
      </p>

      {mismatched ? (
        <div className="mt-6">
          <Alert>
            This invitation is for {invitation.email}, but you are signed in as{' '}
            {session.user.email}. Sign out and open the link again.
          </Alert>
        </div>
      ) : (
        <div className="mt-6">
          <AcceptInvite invitationId={id} />
        </div>
      )}
    </div>
  );
}
