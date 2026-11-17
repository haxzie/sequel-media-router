import { redirect } from 'next/navigation';

/** /settings has no content of its own; Members is the landing tab. */
export default function SettingsIndex() {
  redirect('/settings/members');
}
