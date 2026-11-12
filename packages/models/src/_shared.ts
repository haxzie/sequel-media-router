/**
 * Helpers shared by model definitions.
 *
 * Providers disagree about how they hand back a generated file: some return a
 * URL, some base64 in JSON, some raw bytes. `collectAssets` absorbs all three so
 * an individual model file stays a declaration rather than a parser.
 */
import type { Asset, RunContext } from '@forge/core';
import type { RunResult } from '@forge/core';

/** Where in a JSON result to look for the payload, in priority order. */
const DEFAULT_KEYS = ['video', 'image', 'audio', 'url', 'b64_json', 'data'];

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

export interface CollectOptions {
  mime: string;
  ext: string;
  /** Extra keys to check before the defaults. */
  keys?: string[];
}

/**
 * Turn a provider response into assets.
 *
 * A URL is passed through as-is — re-hosting someone else's CDN link would cost
 * bandwidth for nothing. Bytes and base64 are persisted through `ctx.storeAsset`
 * so the caller always ends up with something fetchable.
 */
export async function collectAssets(
  result: RunResult,
  ctx: RunContext,
  options: CollectOptions,
): Promise<Asset[]> {
  if (result.bytes) {
    return [
      await ctx.storeAsset({ bytes: result.bytes, mime: result.mime ?? options.mime, ext: options.ext }),
    ];
  }

  const payload = (result.json?.result ?? result.json) as Record<string, unknown> | undefined;
  if (!payload) return [];

  const keys = [...(options.keys ?? []), ...DEFAULT_KEYS];
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === 'string' && value.length > 0) {
      if (isUrl(value)) return [{ url: value, mime: options.mime }];
      return [
        await ctx.storeAsset({
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
            ? { url: raw, mime: options.mime }
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

  return [];
}

/** Cloudflare publishes schemas at two different paths depending on the runtime. */
export function partnerSchemaUrl(provider: string, slug: string): string {
  return `https://developers.cloudflare.com/ai/models/${provider}/${slug}/schema-input.json`;
}
export function workersAiSchemaUrl(slug: string): string {
  return `https://developers.cloudflare.com/workers-ai/models/${slug}/schema-input.json`;
}
