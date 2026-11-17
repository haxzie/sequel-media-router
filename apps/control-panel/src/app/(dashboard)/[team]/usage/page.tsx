import { UsagePanels } from '@/components/usage/usage-panels';
import { requireOnboarded } from '@/lib/session';

export const metadata = { title: 'Usage — Sequel' };
export const dynamic = 'force-dynamic';

export default async function UsagePage() {
  await requireOnboarded();
  return <UsagePanels />;
}
