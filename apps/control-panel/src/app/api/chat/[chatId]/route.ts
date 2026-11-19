import { resolveActor } from '@/lib/actor';
import { deleteChat } from '@/lib/chats';

export const dynamic = 'force-dynamic';

/**
 * Delete a conversation.
 *
 * The generated assets are not touched: they are referenced by task records
 * and by whatever the person did with the links, and a chat is the record of
 * the asking, not of what was made.
 */
export async function DELETE(_request: Request, ctx: { params: Promise<{ chatId: string }> }) {
  const actor = await resolveActor(_request);
  if (!actor?.organizationId) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const { chatId } = await ctx.params;
  const deleted = await deleteChat({ chatId, organizationId: actor.organizationId });

  // A chat that is not there, or belongs to another team, reads the same.
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ ok: true });
}
