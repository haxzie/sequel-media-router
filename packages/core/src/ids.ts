/**
 * Entity identifiers.
 *
 * Stripe's convention: a short type prefix, an underscore, then random base62.
 * The prefix is the point — an id that leaks into a log, a URL or a support
 * conversation says what it is without anyone looking it up, and a value pasted
 * into the wrong field fails loudly instead of silently matching.
 *
 * 22 characters of base62 is ~130 bits, comfortably past collision concerns at
 * any volume this will see.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const ID_PREFIX = {
  user: 'usr',
  session: 'ses',
  account: 'acc',
  verification: 'vrf',
  organization: 'org',
  member: 'mem',
  invitation: 'inv',
  team: 'team',
  teamMember: 'tmem',
  organizationRole: 'role',
  task: 'task',
  asset: 'ast',
} as const;

export type EntityKind = keyof typeof ID_PREFIX;

export function randomSuffix(length = 22): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

export function newId(kind: EntityKind, length = 22): string {
  return `${ID_PREFIX[kind]}_${randomSuffix(length)}`;
}

/**
 * Prefix for a Better Auth model name. Returns undefined for a model we have
 * not claimed, so the caller can fall back to the library's own generator
 * rather than inventing a prefix for a table it does not know about.
 */
export function prefixForModel(model: string): string | undefined {
  return (ID_PREFIX as Record<string, string | undefined>)[model];
}
