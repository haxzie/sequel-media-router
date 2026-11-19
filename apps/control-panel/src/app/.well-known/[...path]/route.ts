import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * OAuth discovery documents, at the origin root where clients look for them.
 *
 * Better Auth serves these from an onRequest hook that matches on the raw
 * pathname — /.well-known/oauth-protected-resource and, per RFC 9728, the
 * same path with the resource's own path appended. But the handler is mounted
 * at /api/auth/[...all], so in Next those requests 404 long before the hook
 * can see them. This route exists only to put them back in front of it.
 *
 * Without it an MCP client gets a 401 from /mcp, looks for the document
 * that would tell it which authorization server to use, finds nothing, and
 * stops. Everything else about the OAuth flow can be correct and the client
 * still cannot begin.
 */
async function handler(request: Request) {
  const auth = await getAuth();
  // The original Request goes through untouched: the hook reads the pathname
  // off it, so rewriting the URL here would stop it matching.
  return auth.handler(request);
}

export { handler as GET, handler as HEAD };
