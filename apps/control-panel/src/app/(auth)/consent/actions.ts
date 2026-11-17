'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';

/**
 * Record the decision and go where the provider says.
 *
 * Done server-side so the signed query is verified by the endpoint that
 * signed it, and the browser never has to be trusted to follow a redirect it
 * could rewrite.
 */
export async function decide(accept: boolean, oauthQuery: string) {
  const auth = await getAuth();

  const result = (await auth.api.oauth2Consent({
    body: { accept, oauth_query: oauthQuery },
    headers: await headers(),
  })) as { redirect?: boolean; url?: string };

  // A denial redirects too — back to the client with access_denied, which is
  // the answer it is entitled to.
  if (result?.url) redirect(result.url);
  redirect('/');
}
