import { CreateChat } from '@/components/create/chat';
import { listChats } from '@/lib/chats';
import { getActiveOrganization, requireOnboarded } from '@/lib/session';

export const metadata = { title: 'Create — Sequel' };
export const dynamic = 'force-dynamic';

export default async function CreatePage() {
  await requireOnboarded();

  /*
   * Scoped to the team from the session, never from the URL.
   *
   * Twenty, which is a history rather than a glimpse of one, and still a
   * bounded list: it sits under the composer, so the screen opens on the
   * empty box either way.
   */
  const org = await getActiveOrganization();
  const recent = org ? (await listChats(org.id, 20)).filter((chat) => chat.title) : [];

  return (
    <CreateChat
      recent={recent.map((chat) => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
      }))}
    />
  );
}
