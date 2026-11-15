import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { EMAIL_IS_CONSOLE_ONLY } from '@/lib/email';
import { getSession } from '@/lib/session';

export const metadata = { title: 'Sign in — Sequel' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  if (await getSession()) redirect('/');

  // An invite link opened signed-out bounces through here; carry the id so the
  // person lands back on the invitation rather than on an empty dashboard.
  const { invite } = await searchParams;
  const callbackURL = invite ? `/invite/${encodeURIComponent(invite)}` : '/';

  // Rendered server-side: the client must not be able to see whether Google is
  // configured by probing, and an unconfigured button that 500s is worse than
  // no button.
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <LoginForm
      googleEnabled={googleEnabled}
      consoleOnlyEmail={EMAIL_IS_CONSOLE_ONLY}
      callbackURL={callbackURL}
    />
  );
}
