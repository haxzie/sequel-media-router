import { getCloudflareContext } from '@opennextjs/cloudflare';
import { newId } from '@sequel/core/ids';
import type { UIMessage } from 'ai';

export interface ChatRow {
  id: string;
  organizationId: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) throw new Error('D1 binding DB is missing.');
  return env.DB;
}

/** First line of what they typed, which is what a chat list wants to show. */
function titleFrom(messages: UIMessage[]): string | null {
  const first = messages.find((message) => message.role === 'user');
  const text = first?.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { text: string }).text)
    .join(' ')
    .trim();
  if (!text) return null;
  return text.length > 70 ? `${text.slice(0, 69)}…` : text;
}

/**
 * The chat id is minted by the browser, not here.
 *
 * It lets the URL change the moment the first message is sent, without a
 * round trip that would interrupt the stream. The server's job is to make the
 * row exist and to refuse an id that already belongs to someone else.
 */
export async function ensureChat(params: {
  chatId: string;
  organizationId: string;
  userId: string;
  messages: UIMessage[];
}): Promise<ChatRow | null> {
  const handle = await db();
  const existing = await handle
    .prepare(`SELECT * FROM chat WHERE id = ?`)
    .bind(params.chatId)
    .first<ChatRow>();

  if (existing) {
    // Same 'not yours' answer as 'does not exist' — a chat id should not be
    // probeable.
    if (existing.organizationId !== params.organizationId) return null;
    await handle
      .prepare(`UPDATE chat SET updatedAt = ? WHERE id = ?`)
      .bind(new Date().toISOString(), params.chatId)
      .run();
    return existing;
  }

  const now = new Date().toISOString();
  const chat: ChatRow = {
    id: params.chatId,
    organizationId: params.organizationId,
    userId: params.userId,
    title: titleFrom(params.messages),
    createdAt: now,
    updatedAt: now,
  };

  await handle
    .prepare(
      `INSERT INTO chat (id, organizationId, userId, title, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(chat.id, chat.organizationId, chat.userId, chat.title, chat.createdAt, chat.updatedAt)
    .run();

  return chat;
}

export async function getChat(
  chatId: string,
  organizationId: string,
): Promise<{ chat: ChatRow; messages: UIMessage[] } | null> {
  const handle = await db();
  const chat = await handle
    .prepare(`SELECT * FROM chat WHERE id = ? AND organizationId = ?`)
    .bind(chatId, organizationId)
    .first<ChatRow>();
  if (!chat) return null;

  const { results } = await handle
    .prepare(`SELECT * FROM chatMessage WHERE chatId = ? ORDER BY createdAt ASC`)
    .bind(chatId)
    .all<{ id: string; role: string; parts: string; metadata: string | null }>();

  return {
    chat,
    messages: (results ?? []).map((row) => ({
      id: row.id,
      role: row.role as UIMessage['role'],
      parts: JSON.parse(row.parts) as UIMessage['parts'],
      // Tool timings, written by the server that ran them. Absent on older
      // rows and on messages that called nothing.
      metadata: row.metadata ? (JSON.parse(row.metadata) as unknown) : undefined,
    })),
  };
}

export async function listChats(organizationId: string, limit = 50): Promise<ChatRow[]> {
  const { results } = await (await db())
    .prepare(
      `SELECT * FROM chat WHERE organizationId = ? ORDER BY updatedAt DESC LIMIT ?`,
    )
    .bind(organizationId, limit)
    .all<ChatRow>();
  return results ?? [];
}

/**
 * Replace the chat's messages with the current set.
 *
 * A delete-and-insert rather than an append: the assistant's message is only
 * complete when the stream ends, and the client sends the whole conversation
 * on every turn anyway. Appending would need to reconcile ids that the client
 * may have regenerated.
 */
export async function saveMessages(chatId: string, messages: UIMessage[]): Promise<void> {
  const handle = await db();
  const now = Date.now();

  await handle.batch([
    handle.prepare(`DELETE FROM chatMessage WHERE chatId = ?`).bind(chatId),
    ...messages.map((message, index) =>
      handle
        .prepare(
          `INSERT INTO chatMessage (id, chatId, role, parts, metadata, createdAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          message.id?.startsWith('msg_') ? message.id : newId('chatMessage'),
          chatId,
          message.role,
          JSON.stringify(message.parts),
          message.metadata === undefined ? null : JSON.stringify(message.metadata),
          // Index keeps insertion order stable; two messages in the same
          // millisecond would otherwise sort arbitrarily on reload.
          new Date(now + index).toISOString(),
        ),
    ),
    handle
      .prepare(`UPDATE chat SET updatedAt = ? WHERE id = ?`)
      .bind(new Date().toISOString(), chatId),
  ]);
}

export interface ChatFile {
  id: string;
  name: string;
  mime: string;
  bytes: number;
  url: string;
}

export async function addChatFile(params: {
  chatId: string;
  organizationId: string;
  userId: string;
  name: string;
  mime: string;
  bytes: number;
  url: string;
}): Promise<ChatFile> {
  const file: ChatFile = {
    id: newId('chatFile'),
    name: params.name,
    mime: params.mime,
    bytes: params.bytes,
    url: params.url,
  };

  await (await db())
    .prepare(
      `INSERT INTO chatFile (id, chatId, organizationId, userId, name, mime, bytes, url, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      file.id,
      params.chatId,
      params.organizationId,
      params.userId,
      file.name,
      file.mime,
      file.bytes,
      file.url,
      new Date().toISOString(),
    )
    .run();

  return file;
}

/** Everything attached to this chat, oldest first. */
export async function listChatFiles(
  chatId: string,
  organizationId: string,
): Promise<ChatFile[]> {
  const { results } = await (await db())
    .prepare(
      `SELECT id, name, mime, bytes, url FROM chatFile
       WHERE chatId = ? AND organizationId = ? ORDER BY createdAt ASC`,
    )
    .bind(chatId, organizationId)
    .all<ChatFile>();
  return results ?? [];
}
