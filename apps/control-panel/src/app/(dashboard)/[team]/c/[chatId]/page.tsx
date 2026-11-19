import { notFound } from 'next/navigation';
import { CreateChat } from '@/components/create/chat';
import { getChat } from '@/lib/chats';
import { getActiveOrganization, requireOnboarded } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const org = await getActiveOrganization();
  const loaded = org ? await getChat(chatId, org.id) : null;
  return { title: loaded?.chat.title ? `${loaded.chat.title} — Sequel` : 'Chat — Sequel' };
}

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  await requireOnboarded();

  const org = await getActiveOrganization();
  if (!org) return null;

  /*
   * A chat that does not exist and one belonging to another team give the
   * same 404 — a chat id should not be probeable.
   *
   * It can also legitimately be missing: the id is minted in the browser and
   * the row is written on the first message, so a refresh in that window
   * finds nothing. Rendering an empty chat on the same id recovers from that
   * instead of showing an error for something that is about to exist.
   */
  const loaded = await getChat(chatId, org.id);
  if (!loaded) {
    if (!chatId.startsWith('cht_')) notFound();
    return <CreateChat chatId={chatId} />;
  }

  return (
    <CreateChat chatId={chatId} initialMessages={loaded.messages} title={loaded.chat.title} />
  );
}
