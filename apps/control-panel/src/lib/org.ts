import { randomSuffix } from '@sequel/core/ids';
import type { getAuth } from './auth';

type Auth = Awaited<ReturnType<typeof getAuth>>;

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org'
  );
}

/**
 * Slugs are unique across every organization, so two people naming theirs the
 * same thing would collide. Suffix rather than reject: the name is theirs to
 * fix later, and failing a signup over a slug is absurd.
 */
export async function uniqueSlug(auth: Auth, name: string): Promise<string> {
  const base = slugify(name);
  for (const candidate of [base, `${base}-${randomSuffix(6).toLowerCase()}`]) {
    const { status } = await auth.api.checkOrganizationSlug({ body: { slug: candidate } });
    if (status) return candidate;
  }
  return `${base}-${randomSuffix(10).toLowerCase()}`;
}
