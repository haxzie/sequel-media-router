import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

/**
 * Prerendered pages are served from the Worker's static assets.
 *
 * Without an incremental cache, OpenNext re-renders a prerendered page on
 * every request — which is fatal here rather than merely slow: the blog and
 * the docs read their content with `node:fs` at build time, and a Worker has
 * no filesystem, so `/blog` and `/docs` answered 500 in production while
 * working locally.
 *
 * The static-assets cache is the right one for this app because nothing
 * revalidates at runtime: content ships with the build, and the dynamic
 * surfaces (chat, tasks, the API) are server-rendered rather than cached.
 * Writes are no-ops, so there is no bucket to provision or pay for.
 */
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
