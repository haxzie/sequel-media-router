import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConsentForm } from '@/components/auth/consent-form';
import { getAuth } from '@/lib/auth';
import { getSession } from '@/lib/session';

export const metadata = { title: 'Authorize — Sequel' };
export const dynamic = 'force-dynamic';

/**
 * The approval screen an MCP client is sent to before it gets a token.
 *
 * This is the whole safety story for dynamic client registration. Anyone who
 * can reach the server can register a client under any name and logo they
 * like, so nothing about the client is trustworthy on its own — the only
 * control is that a person reads the name it chose and decides.
 */
export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  /*
   * The signed query, forwarded intact.
   *
   * Everything here was signed by the authorize endpoint — client, scopes,
   * redirect, an expiry and a signature over the lot. We pass it back exactly
   * as received and let the server verify it, so this page never has to be
   * trusted to have preserved it faithfully.
   */
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) for (const item of value) query.append(key, item);
    else if (value !== undefined) query.append(key, value);
  }

  const oauthQuery = query.toString();
  const clientId = typeof params.client_id === 'string' ? params.client_id : '';

  // Signed out, or arrived here directly — authorize is the only legitimate
  // way in, and it is the thing that can mint a valid query.
  if (!clientId || !params.sig) redirect('/');
  const session = await getSession();
  if (!session) redirect(`/login?${oauthQuery}`);

  const auth = await getAuth();
  /*
   * Registration metadata, in RFC 7591 naming: client_name and logo_uri, not
   * name and icon. Reading the wrong field fails silently — the screen still
   * renders, just with a random client id where the app's name should be,
   * which is the one thing on this page a person is meant to judge.
   */
  const client = (await auth.api
    .getOAuthClientPublic({ query: { client_id: clientId }, headers: await headers() })
    .catch(() => null)) as { client_name?: string; logo_uri?: string | null } | null;

  const scopes = (typeof params.scope === 'string' ? params.scope : '').split(' ').filter(Boolean);

  return (
    <ConsentForm
      oauthQuery={oauthQuery}
      clientName={client?.client_name || clientId}
      clientIcon={client?.logo_uri ?? null}
      scopes={scopes}
      account={session.user.email ?? session.user.name ?? ''}
    />
  );
}
