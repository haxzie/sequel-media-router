/**
 * Process-wide Forge singleton.
 *
 * Built once and cached on `globalThis` so Next's dev hot-reload does not
 * rebuild the embedding index on every edit. `ready()` is awaited by each route
 * that needs search; it is idempotent.
 */
import {
  CloudflareAI,
  FileStore,
  Forge,
  LocalUploads,
  MemoryStore,
  R2Uploads,
  createRegistry,
  type Store,
  type Uploads,
} from '@forge/core';
import { allModels } from '@forge/models';

declare global {
  // eslint-disable-next-line no-var
  var __forge: Forge | undefined;
  // eslint-disable-next-line no-var
  var __forgeToken: symbol | undefined;
}

/**
 * Fresh on every evaluation of this module. In production the module evaluates
 * once, so the singleton is reused; under dev hot-reload the token changes and
 * the Forge is rebuilt — otherwise edits to @forge/core would appear to do
 * nothing, because the old instance survives on globalThis.
 */
const MODULE_TOKEN = Symbol('forge-module');

export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/** Local-disk root for the fallback file driver. */
export const LOCAL_FILE_DIR = '.data/files';

function buildStore(): Store {
  // The Workers runtime has no writable filesystem; fall back to memory there.
  const onWorkers = typeof process === 'undefined' || !process.versions?.node;
  return onWorkers ? new MemoryStore() : new FileStore('.data/store.json');
}

function buildUploads(): Uploads {
  return R2Uploads.fromEnv() ?? new LocalUploads(LOCAL_FILE_DIR, baseUrl());
}

export function getForge(): Forge {
  if (globalThis.__forge && globalThis.__forgeToken === MODULE_TOKEN) {
    return globalThis.__forge;
  }

  const forge = new Forge({
    registry: createRegistry(allModels),
    store: buildStore(),
    uploads: buildUploads(),
    ai: CloudflareAI.fromEnv(),
    waitUntil: (promise) => {
      void promise.catch((error) => {
        console.error('[forge] background task failed:', error);
      });
    },
  });

  globalThis.__forge = forge;
  globalThis.__forgeToken = MODULE_TOKEN;
  return forge;
}

/** True when inference is possible at all. The UI warns rather than failing silently. */
export function hasCredentials(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
}
