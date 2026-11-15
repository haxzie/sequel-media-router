'use client';

import { createAuthClient } from 'better-auth/react';
import { apiKeyClient } from '@better-auth/api-key/client';
import { magicLinkClient, organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [apiKeyClient(), magicLinkClient(), organizationClient()],
});

export const { signIn, signOut, useSession, organization } = authClient;
