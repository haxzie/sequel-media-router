import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { EMAIL_IS_CONSOLE_ONLY } from '@/lib/email';
import { getSession } from '@/lib/session';

export const metadata = { title: 'Sign in — Sequel' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  /*
   * An MCP client sent them here mid-authorization.
   *
   * The authorize endpoint signs its parameters and redirects here when there
   * is no session. Those parameters are the flow — drop them and the person
   * signs in successfully and the client is still waiting, with nothing to
   * tell it why. So they are carried through and handed straight back to
   * authorize, which verifies its own signature and resumes.
   */
  const oauth = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) for (const item of value) oauth.append(key, item);
    else if (value !== undefined) oauth.append(key, value);
  }
  const resuming = Boolean(params.client_id && params.sig);
  const authorizeURL = `/api/auth/oauth2/authorize?${oauth.toString()}`;

  if (await getSession()) redirect(resuming ? authorizeURL : '/');

  // An invite link opened signed-out bounces through here; carry the id so the
  // person lands back on the invitation rather than on an empty dashboard.
  const invite = typeof params.invite === 'string' ? params.invite : undefined;
  const callbackURL = resuming
    ? authorizeURL
    : invite
      ? `/invite/${encodeURIComponent(invite)}`
      : '/';

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
