/**
 * Join a path onto a team.
 *
 * Every dashboard route lives under `/[team]`, and an absolute href written
 * by hand drops that segment silently: `/settings/members` is a real-looking
 * link to a route that does not exist. That is how the whole settings tab
 * strip, and the Settings item in the sidebar, ended up pointing at 404s —
 * each one typed the path it wanted and lost the team.
 *
 * Deliberately not a client module. A `'use client'` here turns this into a
 * client reference, and a server component calling it gets "Attempted to
 * call teamPath() from the server". The hook that wraps it lives next door
 * in use-team-path.ts.
 */
export function teamPath(team: string, path: string): string {
  const tail = path.replace(/^\/+/, '');
  return tail ? `/${team}/${tail}` : `/${team}`;
}
