'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { teamPath } from './team-path';

/**
 * Build a path inside the team whose route you are rendering in.
 *
 *   const path = useTeamPath();
 *   <Link href={path('/settings/members')} />   // → /northwind/settings/members
 *
 * Only works where `[team]` is in the route. Outside it there is no team to
 * scope to, which is a mistake worth seeing: it throws in development and
 * falls back to the raw path in production, because a mis-scoped link is
 * better than a white screen in front of a customer.
 */
export function useTeamPath(): (path: string) => string {
  const params = useParams<{ team?: string }>();
  const team = params?.team;

  return useCallback(
    (path: string) => {
      if (!team) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error(
            `useTeamPath() was called outside a /[team] route, for "${path}". ` +
              'Use the plain path, or move the component inside the dashboard.',
          );
        }
        return path;
      }
      return teamPath(team, path);
    },
    [team],
  );
}
