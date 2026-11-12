/**
 * Cloudflare AI client.
 *
 * Two endpoints, one wrapper:
 *   - Workers AI native  →  POST /ai/run/{@cf/vendor/slug}   body = the input
 *   - AI Gateway partner →  POST /ai/run                     body = {model, input}
 *
 * Both are reachable over plain HTTPS with an account id and an API token, which
 * is why the control panel can run anywhere — `next dev` on a laptop or a Worker
 * — without changing a line.
 */
import type { Runtime } from './types';

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  /** Optional AI Gateway slug. When set, requests route through the gateway for caching and logs. */
  gateway?: string;
  baseUrl?: string;
}

export class CloudflareError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'CloudflareError';
  }
}

/** Normalised result of an inference call. */
export interface RunResult {
  /** Parsed JSON body when the provider returned JSON. */
  json?: Record<string, unknown>;
  /** Raw bytes when the provider returned binary (some image and audio models do). */
  bytes?: ArrayBuffer;
  mime?: string;
  /** `Completed`, `Queued`, … as reported by the unified endpoint. */
  state?: string;
}

export class CloudflareAI {
  private readonly base: string;

  constructor(private readonly config: CloudflareConfig) {
    this.base = config.baseUrl ?? 'https://api.cloudflare.com/client/v4';
  }

  static fromEnv(env: Record<string, string | undefined> = process.env): CloudflareAI | null {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) return null;
    return new CloudflareAI({ accountId, apiToken, gateway: env.CLOUDFLARE_AI_GATEWAY });
  }

  private url(runtime: Runtime, model: string): string {
    const root = `${this.base}/accounts/${this.config.accountId}/ai/run`;
    // The gateway slug is appended as a query param so the same path serves both.
    const qs = this.config.gateway ? `?gateway=${encodeURIComponent(this.config.gateway)}` : '';
    return runtime === 'workers-ai' ? `${root}/${model}${qs}` : `${root}${qs}`;
  }

  /**
   * Run inference. `input` is already schema-validated by the model's `parse`,
   * so anything rejected here is a provider-side disagreement worth surfacing raw.
   */
  async run(
    opts: { model: string; runtime: Runtime; input: Record<string, unknown>; signal?: AbortSignal },
  ): Promise<RunResult> {
    const body =
      opts.runtime === 'workers-ai' ? opts.input : { model: opts.model, input: opts.input };

    const res = await fetch(this.url(opts.runtime, opts.model), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.config.apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });

    const mime = res.headers.get('content-type') ?? '';

    if (!mime.includes('application/json')) {
      const bytes = await res.arrayBuffer();
      if (!res.ok) {
        throw new CloudflareError(`Cloudflare AI ${res.status} for ${opts.model}`, res.status, null);
      }
      return { bytes, mime: mime.split(';')[0] || 'application/octet-stream' };
    }

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok || json.success === false) {
      const errors = json.errors as Array<{ message?: string }> | undefined;
      const detail = errors?.map((e) => e.message).filter(Boolean).join('; ');
      throw new CloudflareError(
        detail || `Cloudflare AI ${res.status} for ${opts.model}`,
        res.status,
        json,
      );
    }
    return { json, state: typeof json.state === 'string' ? json.state : undefined };
  }

  /**
   * Embed text with `@cf/baai/bge-base-en-v1.5` (768-dim). Used to build the model
   * search index; see embeddings.ts.
   */
  async embed(texts: string[], signal?: AbortSignal): Promise<number[][]> {
    if (texts.length === 0) return [];
    const result = await this.run({
      model: '@cf/baai/bge-base-en-v1.5',
      runtime: 'workers-ai',
      input: { text: texts },
      signal,
    });
    const data = (result.json?.result as { data?: number[][] } | undefined)?.data;
    if (!Array.isArray(data)) {
      throw new CloudflareError('Embedding response had no data array', 500, result.json);
    }
    return data;
  }
}

/** Dimension of `@cf/baai/bge-base-en-v1.5`. Pinned so a cache mismatch is loud. */
export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
export const EMBEDDING_DIMENSIONS = 768;
