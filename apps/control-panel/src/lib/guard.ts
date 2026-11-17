import type { TaskActor } from '@sequel/core';
import { resolveActor } from './actor';

/**
 * Refuse a request that carries no usable credential.
 *
 * The line is drawn at consequence, not at secrecy: reading the catalogue is
 * open, because the same list is printed on the marketing page and an agent
 * should be able to look before it signs up. Anything that spends money or
 * reads a team's own data needs to say who it is.
 *
 * Returns the actor, or a Response to return as-is.
 */
export async function requireActor(
  request: Request,
): Promise<{ actor: TaskActor } | { response: Response }> {
  const actor = await resolveActor(request);
  if (actor) return { actor };

  return {
    response: Response.json(
      {
        error: 'unauthorized',
        error_description:
          'This endpoint needs an API key. Send it as "authorization: Bearer sk_sequel_...", or create one in Settings → API Keys.',
      },
      {
        status: 401,
        // So a client is told how to authenticate rather than guessing.
        headers: { 'www-authenticate': 'Bearer realm="sequel"' },
      },
    ),
  };
}
