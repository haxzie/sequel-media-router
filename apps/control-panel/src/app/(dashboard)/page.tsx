import { CreateChat } from '@/components/create/chat';
import { requireOnboarded } from '@/lib/session';

export const metadata = { title: 'Create — Sequel' };
export const dynamic = 'force-dynamic';

export default async function CreatePage() {
  await requireOnboarded();
  return <CreateChat />;
}
