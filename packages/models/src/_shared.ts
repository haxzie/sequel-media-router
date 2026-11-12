/**
 * Helpers shared by model definitions.
 *
 * Providers disagree about how they hand back a generated file: a URL, base64
 * in JSON, or raw bytes — and they disagree about how deeply they nest it.
 * `collectAssets` absorbs all of that so an individual model file stays a
 * declaration rather than a parser.
 */
import type { Asset, RunContext } from '@forge/core';
import type { RunResult } from '@forge/core';

/** Where in a payload to look for the media, in priority order. */
const DEFAULT_KEYS = ['video', 'image', 'audio', 'url', 'b64_json', 'data'];

/**
 * Partner models answer through AI Gateway with the payload nested twice and a
 * `state` alongside it:
 *
 *   { result: { state: 'Completed', result: { video: 'https://…' } } }
 *
 * The published example shows it flat, so unwrap defensively rather than
 * indexing a fixed depth.
 */
function unwrap(json: Record<string, unknown> | undefined): {
  payload: Record<string, unknown> | undefined;
  state?: string;
} {
  let node = json;
  let state: string | undefined;

  for (let depth = 0; depth < 4; depth++) {
    if (!node || typeof node !== 'object') break;
    if (typeof node.state === 'string') state = node.state;

    const inner = node.result;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      node = inner as Record<string, unknown>;
      continue;
    }
    break;
  }
  return { payload: node, state };
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const clean = b64.includes(',') ? b64.slice(b64.indexOf(',') + 1) : b64;
  const binary = atob(clean);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Copy a provider's output into our own storage.
 *
 * Always, not just for obviously-expiring links. Cloudflare's presigned R2 URLs
 * die in 24 hours and a provider CDN link (MiniMax hands one back) is outside
 * our control and ~115 characters. Re-hosting makes every result durable, short
 * and consistent, at the cost of one transfer.
 */
async function assetFromUrl(
  url: string,
  ctx: RunContext,
  options: CollectOptions,
): Promise<Asset> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    const bytes = await res.arrayBuffer();
    return await ctx.storeAsset({
      bytes,
      mime: res.headers.get('content-type')?.split(';')[0] || options.mime,
      ext: options.ext,
    });
  } catch {
    // Best-effort: a provider link that works now beats no link at all.
    return { url, mime: options.mime };
  }
}

export interface CollectOptions {
  mime: string;
  ext: string;
  /** Extra keys to check before the defaults. */
  keys?: string[];
}

export async function collectAssets(
  result: RunResult,
  ctx: RunContext,
  options: CollectOptions,
): Promise<Asset[]> {
  if (result.bytes) {
    return [
      await ctx.storeAsset({
        bytes: result.bytes,
        mime: result.mime ?? options.mime,
        ext: options.ext,
      }),
    ];
  }

  const { payload, state } = unwrap(result.json);
  if (!payload) return [];

  // A provider that is still working has not failed — say so plainly rather
  // than returning an empty list that reads as success.
  if (state && state.toLowerCase() !== 'completed') {
    throw new Error(`Provider reported state "${state}" rather than Completed.`);
  }

  const keys = [...(options.keys ?? []), ...DEFAULT_KEYS];
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === 'string' && value.length > 0) {
      return [
        isUrl(value)
          ? await assetFromUrl(value, ctx, options)
          : await ctx.storeAsset({
              bytes: base64ToArrayBuffer(value),
              mime: options.mime,
              ext: options.ext,
            }),
      ];
    }

    if (Array.isArray(value)) {
      const assets: Asset[] = [];
      for (const entry of value) {
        const raw =
          typeof entry === 'string'
            ? entry
            : ((entry as Record<string, unknown> | null)?.url ??
              (entry as Record<string, unknown> | null)?.b64_json);
        if (typeof raw !== 'string' || raw.length === 0) continue;
        assets.push(
          isUrl(raw)
            ? await assetFromUrl(raw, ctx, options)
            : await ctx.storeAsset({
                bytes: base64ToArrayBuffer(raw),
                mime: options.mime,
                ext: options.ext,
              }),
        );
      }
      if (assets.length > 0) return assets;
    }
  }

  // Known keys missed. Shapes move, so walk the payload for any http(s) URL
  // rather than giving up — a silent empty result is the worst outcome.
  const found = findUrl(payload, 0);
  return found ? [await assetFromUrl(found, ctx, options)] : [];
}

/** Depth-bounded search for the first http(s) URL anywhere in the payload. */
function findUrl(node: unknown, depth: number): string | null {
  if (depth > 6 || node == null) return null;
  if (typeof node === 'string') return isUrl(node) ? node : null;
  if (Array.isArray(node)) {
    for (const entry of node) {
      const hit = findUrl(entry, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof node === 'object') {
    for (const value of Object.values(node as Record<string, unknown>)) {
      const hit = findUrl(value, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Some models take a media reference as a URL, others demand base64 inline.
 * Callers should not have to care: `get_upload_url` hands back a URL, so when a
 * model wants bytes we fetch and encode on their behalf.
 */
export async function toBase64(urlOrBase64: string): Promise<string> {
  if (!/^https?:\/\//i.test(urlOrBase64)) {
    // Already base64, with or without a data: prefix.
    return urlOrBase64.includes(',') ? urlOrBase64.slice(urlOrBase64.indexOf(',') + 1) : urlOrBase64;
  }

  const res = await fetch(urlOrBase64);
  if (!res.ok) {
    throw new Error(
      `Could not fetch the reference image (${res.status}). It must be reachable by Cloudflare — use get_upload_url to host it.`,
    );
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  // Chunked so a large image does not blow the argument limit on String.fromCharCode.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Cloudflare publishes schemas at two different paths depending on the runtime. */
export function partnerSchemaUrl(provider: string, slug: string): string {
  return `https://developers.cloudflare.com/ai/models/${provider}/${slug}/schema-input.json`;
}
export function workersAiSchemaUrl(slug: string): string {
  return `https://developers.cloudflare.com/workers-ai/models/${slug}/schema-input.json`;
}
