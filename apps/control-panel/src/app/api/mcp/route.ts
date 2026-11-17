/**
 * MCP Streamable HTTP endpoint.
 *
 * POST carries a JSON-RPC message (or a batch). Notifications get 202 with no
 * body; requests get 200 with the response. GET is advertised but we hold no
 * server-initiated stream, so it returns 405 as the spec allows.
 */
import { requireMcpAuth } from '@better-auth/mcp';
import type { TaskActor } from '@sequel/core';
import { actorFromClaims, resolveActor } from '@/lib/actor';
import { getAuth, mcpResource } from '@/lib/auth';
import { getForge } from '@/lib/forge';
import { handleMcpMessage } from '@/lib/mcp';

export const dynamic = 'force-dynamic';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization, mcp-session-id, mcp-protocol-version',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  return new Response(
    JSON.stringify({ error: 'This MCP server does not expose a server-initiated stream.' }),
    { status: 405, headers: { 'content-type': 'application/json', ...CORS } },
  );
}

/** Dispatch the message (or batch) on behalf of whoever sent it. */
async function dispatch(body: unknown, actor: TaskActor | null) {
  const forge = getForge();
  const messages = Array.isArray(body) ? body : [body];
  const responses = [];

  for (const message of messages) {
    const response = await handleMcpMessage(forge, message as never, actor);
    if (response) responses.push(response);
  }

  // Every message was a notification.
  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });
  return Response.json(Array.isArray(body) ? responses : responses[0], { headers: CORS });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.clone().json();
  } catch {
    return Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400, headers: CORS },
    );
  }

  /*
   * Which door this came through decides how it is authenticated.
   *
   * An API key or a dashboard cookie resolves directly. Anything else — a
   * bearer token, or no credential at all — goes through the OAuth guard,
   * which either verifies the token or answers 401 with the RFC 9728
   * challenge naming our resource metadata. That challenge is the whole
   * mechanism: it is how a client told nothing but a URL discovers where to
   * authorize. Without it an MCP client fails silently and stays anonymous.
   */
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  const resolvesDirectly = bearer.startsWith('sk_sequel_') || Boolean(request.headers.get('cookie'));

  if (resolvesDirectly) {
    /*
     * Resolved once per request, not per message: a batch arrives on one
     * connection with one credential.
     */
    const actor = await resolveActor(request);
    if (actor) return dispatch(body, actor);
    // A credential that did not resolve is not anonymous, it is wrong. Fall
    // through so the client gets a challenge rather than a silent success.
  }

  const auth = await getAuth();
  const guard = requireMcpAuth(
    auth,
    async (_request, claims) => dispatch(body, await actorFromClaims(claims)),
    /*
     * The resource has to be stated. Left out, requireMcpAuth defaults it to
     * the auth server's base URL, and the challenge then points clients at
     * /.well-known/oauth-protected-resource/api/auth — a document describing
     * the wrong resource, for a path we do not serve.
     */
    { resource: mcpResource(), requiredScopes: ['mcp:tools'] },
  );

  return guard(request);
}
