import { CreateChat } from '@/components/create/chat';
import { listChats } from '@/lib/chats';
import { getActiveOrganization, requireOnboarded } from '@/lib/session';

export const metadata = { title: 'Create — Sequel' };
export const dynamic = 'force-dynamic';

export default async function CreatePage() {
  await requireOnboarded();

  /*
   * Scoped to the team from the session, never from the URL. Six is what
   * fits under the composer without the page needing to scroll to show the
   * thing it is actually for.
   */
  const org = await getActiveOrganization();
  const recent = org ? (await listChats(org.id, 6)).filter((chat) => chat.title) : [];

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
