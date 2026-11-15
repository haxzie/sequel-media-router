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
  /** Better Auth names this model by its table, lowercase. */
  apikey: 'key',
  walletCredit: 'cr',
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
 * Id for a Better Auth model.
 *
 * An unclaimed model gets an unprefixed random id rather than deferring to the
 * database. Deferring sounds tidy and is wrong here: every id column is a text
 * primary key with no autoincrement, so "let the database do it" means
 * inserting NULL and failing the NOT NULL constraint. A plugin that adds a
 * table should still be able to write to it.
 */
export function idForModel(model: string): string {
  const prefix = (ID_PREFIX as Record<string, string | undefined>)[model];
  return prefix ? `${prefix}_${randomSuffix()}` : randomSuffix(26);
}
