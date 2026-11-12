/**
 * Short asset links.
 *
 * `/f/<id>` resolves a 10-character handle to a freshly signed URL and
 * redirects. Two reasons this exists rather than handing out the signed URL
 * directly: it is ~35 characters instead of ~400, which matters when an agent
 * relays it into the next tool call; and it never goes stale, because the
 * signature is minted per request rather than baked into what the caller stored.
 */
import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const resolved = await getForge().resolveAlias(id);

  if (!resolved) {
    return Response.json({ error: 'Unknown or expired asset id' }, { status: 404 });
  }

  // 302 rather than 307: this is a GET-only redirect to a different origin, and
  // every HTTP client and every provider fetcher follows it.
  return Response.redirect(resolved.url, 302);
}
