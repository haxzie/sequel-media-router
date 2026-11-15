import { idForModel } from '@sequel/core/ids';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { apiKey } from '@better-auth/api-key';
import { betterAuth } from 'better-auth';
import { magicLink, organization } from 'better-auth/plugins';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { sendMagicLink } from './email';

/**
 * Better Auth, bound to D1.
 *
 * The instance cannot be a module-level constant: the D1 binding only exists
 * inside a request on Workers, so the auth object is built lazily and cached
 * against the binding it was built for. A binding swap (a new isolate, a new
 * `next dev` reload) rebuilds rather than quietly using a dead handle.
 */
let cached: { db: D1Database; auth: ReturnType<typeof build> } | null = null;

export const ROLES = ['owner', 'admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Everything except the database handle. Shared with the codegen entry in
 * `auth-cli.ts` so the generated schema can never drift from the running one.
 */
export function authOptions(database: Parameters<typeof betterAuth>[0]['database']) {
  return {
    database,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,

    advanced: {
      database: {
        /** Stripe-style prefixed ids for every table. See core/src/ids.ts. */
        generateId: ({ model }) => idForModel(model),
        joins: true,
      },
    },

    // Login only. There is no separate sign-up: an unknown email becomes an
    // account, and onboarding collects the rest.
    emailAndPassword: { enabled: false },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
    },

    user: {
      additionalFields: {
        /** The person's own role, from onboarding. Not their org permission. */
        jobRole: { type: 'string', required: false, input: false },
        useCase: { type: 'string', required: false, input: false },
        /** Null until onboarding completes; the gate the layout checks. */
        onboardedAt: { type: 'string', required: false, input: false },
      },
    },

    plugins: [
      apiKey({
        // `sk_` reads as a secret at a glance, the way every other key in a
        // .env file does. `start` keeps the first characters in plain text so
        // a key can be identified in a list without ever storing the rest.
        defaultPrefix: 'sk_sequel_',
        defaultKeyLength: 48,
        startingCharactersConfig: { shouldStore: true, charactersLength: 8 },
        enableMetadata: true,
      }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLink({ email, url });
        },
        expiresIn: 60 * 15,
      }),
      organization({
        // One org per person at signup; more by invitation. Everyone may create
        // one because onboarding has to create the first.
        allowUserToCreateOrganization: true,
        organizationLimit: 10,
        creatorRole: 'owner',
        membershipLimit: 100,
        invitationExpiresIn: 60 * 60 * 24 * 7,
        sendInvitationEmail: async () => {
          // Invites are surfaced as a copyable link in the UI instead. See
          // lib/email.ts for why there is no sender yet.
        },
      }),
    ],
  } satisfies Parameters<typeof betterAuth>[0];
}

function build(d1: D1Database) {
  const db = new Kysely<Record<string, never>>({ dialect: new D1Dialect({ database: d1 }) });
  return betterAuth(authOptions({ db, type: 'sqlite' }));
}

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const d1 = env.DB;
  if (!d1) {
    throw new Error(
      'D1 binding DB is missing. Run `pnpm db:migrate` and start the app with `pnpm dev`.',
    );
  }
  if (!cached || cached.db !== d1) cached = { db: d1, auth: build(d1) };
  return cached.auth;
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;
