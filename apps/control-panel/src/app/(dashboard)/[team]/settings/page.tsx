import { redirect } from 'next/navigation';
import { teamPath } from '@/lib/team-path';

/**
 * /{team}/settings has no content of its own; Members is the landing tab.
 *
 * The team segment has to be carried into the redirect. It used to send
 * everyone to `/settings/members`, which is not a route — every settings
 * page lives under `/[team]` — so the sidebar's own Settings link 404'd.
 */
export default async function SettingsIndex({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  redirect(teamPath(team, '/settings/members'));
}
