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
  R2Uploads,
  createRegistry,
  type Store,
  type Uploads,
} from '@sequel/core';
import { allModels } from '@sequel/models';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { D1Store } from './d1-store';

declare global {
  // eslint-disable-next-line no-var
  var __forge: Forge | undefined;
  // eslint-disable-next-line no-var
  var __forgeToken: symbol | undefined;
}

/**
 * Fresh on every evaluation of this module. In production the module evaluates
 * once, so the singleton is reused; under dev hot-reload the token changes and
 * the Forge is rebuilt — otherwise edits to @sequel/core would appear to do
 * nothing, because the old instance survives on globalThis.
 */
const MODULE_TOKEN = Symbol('forge-module');

export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/** Local-disk root for the fallback file driver. */
export const LOCAL_FILE_DIR = '.data/files';

/**
 * Are we inside a Worker?
 *
 * This used to ask whether `process.versions.node` was missing, which is the
 * right question for a bare Worker and the wrong one for ours: `nodejs_compat`
 * polyfills `process`, so the check said 'Node' in production, the file driver
 * was chosen, and every write hit a read-only filesystem. What reached the
 * chat was three grey boxes reading 'operation not permitted' — EPERM, with
 * no hint of where from.
 *
 * The user-agent string is set by the runtime itself and survives whatever
 * compatibility flags are on.
 */
const ON_WORKERS =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

function buildStore(): Store {
  /*
   * D1 wherever a binding exists, which is both production and `next dev`
   * (miniflare provides one). The file driver stays for the case it was
   * written for: a clone with no Cloudflare account at all, where `pnpm dev`
   * should still run.
   */
  return hasD1() ? new D1Store() : new FileStore('.data/store.json');
}

/**
 * Is there a D1 binding to use?
 *
 * `getCloudflareContext` is async and this is not, so the question is asked
 * the other way round: on Workers there is always one, and off Workers there
 * is one exactly when the dev server is running under miniflare — which is
 * what `next dev` does here, and what a bare `node` script does not.
 */
function hasD1(): boolean {
  if (ON_WORKERS) return true;
  try {
    return Boolean(getCloudflareContext().env.DB);
  } catch {
    return false;
  }
}

function buildUploads(): Uploads {
  const r2 = R2Uploads.fromEnv();
  if (r2) return r2;

  /*
   * Local disk is the no-account fallback for `pnpm dev`, and it cannot work
   * here. Failing loudly at construction beats writing to a filesystem that
   * rejects it once per generated asset.
   */
  if (ON_WORKERS) {
    throw new Error(
      'Uploads need R2 on Workers: set R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.',
    );
  }

  return new LocalUploads(LOCAL_FILE_DIR, baseUrl());
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
    baseUrl: baseUrl(),
    waitUntil: (promise) => {
      void promise.catch((error) => {
        console.error('[forge] background task failed:', error);
      });
    },
    /*
     * Imported lazily. webhooks.ts reaches for the D1 binding, and pulling
     * that in at module scope would make every import of this file — the MCP
     * route, the task API, the dashboard — depend on a Cloudflare context
     * they may not need.
     */
    onTaskSettled: async (task) => {
      const { dispatchTask } = await import('./webhooks');
      await dispatchTask(task);
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
