/**
 * Files attached to a chat.
 *
 * The bytes go through the same uploads path as a model's own output, so an
 * attachment comes back with a short /f/<id> link — which is exactly what
 * run_models takes as `file_url`. Attaching a photo and asking to restyle it
 * is then one hop, with no second storage path to keep in sync.
 */
import { resolveActor } from '@/lib/actor';
import { addChatFile, ensureChat, listChatFiles } from '@/lib/chats';
import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

/** Generous for an image, small enough that a stray video is refused early. */
const MAX_BYTES = 25 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
};

function extensionFor(name: string, mime: string): string {
  const fromName = name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined;
  // The filename is the better source when we recognise it: a browser reports
  // plenty of files as application/octet-stream.
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return EXTENSIONS[mime] ?? 'bin';
}

export async function POST(request: Request, ctx: { params: Promise<{ chatId: string }> }) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const { chatId } = await ctx.params;

  /*
   * Create the row if it is not there yet.
   *
   * You can attach a file before sending anything, and on a new chat the id
   * exists only in the browser at that point. ensureChat still refuses an id
   * belonging to another organisation, which is the check that matters.
   */
  const chat = await ensureChat({
    chatId,
    organizationId: actor.organizationId,
    userId: actor.userId,
    messages: [],
  });
  if (!chat) return Response.json({ error: 'Not found' }, { status: 404 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Expected a file field' }, { status: 400 });
  }
  if (file.size === 0) return Response.json({ error: 'File is empty' }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `File is larger than ${Math.round(MAX_BYTES / 1024 / 1024)}MB.` },
      { status: 413 },
    );
  }

  const mime = file.type || 'application/octet-stream';
  const stored = await getForge().storeAsset({
    bytes: await file.arrayBuffer(),
    mime,
    ext: extensionFor(file.name, mime),
  });

  const record = await addChatFile({
    chatId,
    organizationId: actor.organizationId,
    userId: actor.userId,
    name: file.name || `attachment.${extensionFor(file.name, mime)}`,
    mime,
    bytes: file.size,
    url: stored.url,
  });

  return Response.json(record, { status: 201 });
}

export async function GET(request: Request, ctx: { params: Promise<{ chatId: string }> }) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const { chatId } = await ctx.params;
  return Response.json({ files: await listChatFiles(chatId, actor.organizationId) });
}
