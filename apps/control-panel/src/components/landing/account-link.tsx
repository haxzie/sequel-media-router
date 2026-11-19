'use client';

import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

/**
 * The one personalised thing on a marketing or docs page.
 *
 * Reading the session on the server would make every page that renders this
 * header dynamic — `headers()` opts a route out of static rendering, and the
 * docs and the blog are otherwise entirely build-time. So the label is
 * resolved in the browser instead: the page ships static and HTML-cacheable,
 * and this swaps once the session is known.
 *
 * Renders the signed-out label until then. Both labels lead to the same
 * place, so the worst case is a word that corrects itself, not a wrong link.
 */
export function AccountLink({ className = '' }: { className?: string }) {
  const { data } = useSession();

  return (
    <Link href="/login" className={className}>
      {data?.session ? 'Dashboard' : 'Sign in'}
    </Link>
  );
}

/** The same question, for the docs bar, where the ask is a key. */
export function KeyLink({ className = '' }: { className?: string }) {
  const { data } = useSession();

  return (
    <Link href="/login" className={className}>
      {data?.session ? 'Dashboard' : 'Get an API key'}
    </Link>
  );
}
