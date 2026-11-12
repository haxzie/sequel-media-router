/**
 * MCP Streamable HTTP endpoint.
 *
 * POST carries a JSON-RPC message (or a batch). Notifications get 202 with no
 * body; requests get 200 with the response. GET is advertised but we hold no
 * server-initiated stream, so it returns 405 as the spec allows.
 */
import { handleMcpMessage } from '@/lib/mcp';
import { getForge } from '@/lib/forge';

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

export async function POST(request: Request) {
  const forge = getForge();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400, headers: CORS },
    );
  }

  const messages = Array.isArray(body) ? body : [body];
  const responses = [];
  for (const message of messages) {
    const response = await handleMcpMessage(forge, message as never);
    if (response) responses.push(response);
  }

  // Every message was a notification.
  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });

  return Response.json(Array.isArray(body) ? responses : responses[0], { headers: CORS });
}
