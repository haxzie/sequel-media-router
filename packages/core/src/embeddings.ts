/**
 * Semantic model search.
 *
 * Each model's `searchText()` is embedded once and cached by content hash. On
 * boot we embed only what changed: new models, or models whose description,
 * capabilities or keywords were edited. Everything else is read from cache.
 *
 * Search is HYBRID on purpose. A pure vector score is unusable when Cloudflare
 * credentials are absent (a fresh clone, a CI run), so a lexical score always
 * contributes and the index degrades to keyword search rather than returning
 * nothing. `mode` on the result says which path produced it.
 */
import type { AnyModel } from './define';
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, type CloudflareAI } from './cloudflare';
import type { Modality } from './types';

export interface EmbeddingRecord {
  id: string;
  /** SHA-256 of the embedded text. A change here is what triggers re-embedding. */
  hash: string;
  vector: number[];
  model: string;
}

/** Persistence for the vector cache. Implemented by the Store in storage.ts. */
export interface EmbeddingCache {
  read(): Promise<EmbeddingRecord[]>;
  write(records: EmbeddingRecord[]): Promise<void>;
}

export interface SearchHit {
  model: AnyModel;
  score: number;
  /** Which signals contributed, so a surprising ranking can be explained. */
  signals: { semantic?: number; lexical: number };
}

export interface SearchResult {
  hits: SearchHit[];
  mode: 'hybrid' | 'lexical';
  /** Set when embeddings were expected but unavailable. */
  note?: string;
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    aa += x * x;
    bb += y * y;
  }
  const denom = Math.sqrt(aa) * Math.sqrt(bb);
  return denom === 0 ? 0 : dot / denom;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.+-]+/)
    .filter((t) => t.length > 1);
}

/**
 * Token-overlap score in [0,1]. Crude but predictable, and it is what carries
 * search when there are no vectors.
 */
function lexicalScore(query: string, model: AnyModel): number {
  const q = tokenize(query);
  if (q.length === 0) return 0;
  const haystack = tokenize(model.searchText());
  const bag = new Set(haystack);
  const idSlug = model.id.toLowerCase();

  let hits = 0;
  for (const term of q) {
    if (bag.has(term)) hits += 1;
    else if (idSlug.includes(term) || model.name.toLowerCase().includes(term)) hits += 1;
    else if (haystack.some((h) => h.startsWith(term) && term.length >= 4)) hits += 0.5;
  }
  return Math.min(1, hits / q.length);
}

export class EmbeddingIndex {
  private vectors = new Map<string, number[]>();
  private ready = false;
  private note: string | undefined;

  constructor(
    private readonly models: AnyModel[],
    private readonly ai: CloudflareAI | null,
    private readonly cache?: EmbeddingCache,
  ) {}

  /**
   * Build the index. Safe to call repeatedly; only models whose text hash is
   * missing or stale are sent to the embedding model.
   */
  async build(): Promise<{ embedded: number; cached: number; skipped: boolean }> {
    const existing = new Map<string, EmbeddingRecord>();
    if (this.cache) {
      for (const record of await this.cache.read()) {
        if (record.model === EMBEDDING_MODEL && record.vector.length === EMBEDDING_DIMENSIONS) {
          existing.set(record.id, record);
        }
      }
    }

    const wanted = await Promise.all(
      this.models.map(async (model) => ({ model, hash: await sha256(model.searchText()) })),
    );

    const stale = wanted.filter(({ model, hash }) => existing.get(model.id)?.hash !== hash);

    // Seed from cache first so a failed embed call still leaves a usable index.
    for (const { model, hash } of wanted) {
      const hit = existing.get(model.id);
      if (hit && hit.hash === hash) this.vectors.set(model.id, hit.vector);
    }

    if (stale.length === 0) {
      this.ready = true;
      return { embedded: 0, cached: this.vectors.size, skipped: false };
    }

    if (!this.ai) {
      this.ready = this.vectors.size > 0;
      this.note =
        'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN not set — search is keyword-only.';
      return { embedded: 0, cached: this.vectors.size, skipped: true };
    }

    try {
      const vectors = await this.ai.embed(stale.map(({ model }) => model.searchText()));
      const records: EmbeddingRecord[] = [...existing.values()];
      stale.forEach(({ model, hash }, i) => {
        const vector = vectors[i];
        if (!vector) return;
        this.vectors.set(model.id, vector);
        const next: EmbeddingRecord = { id: model.id, hash, vector, model: EMBEDDING_MODEL };
        const at = records.findIndex((r) => r.id === model.id);
        if (at >= 0) records[at] = next;
        else records.push(next);
      });
      // Drop records for models that no longer exist.
      const live = new Set(this.models.map((m) => m.id));
      await this.cache?.write(records.filter((r) => live.has(r.id)));
      this.ready = true;
      return { embedded: stale.length, cached: this.vectors.size - stale.length, skipped: false };
    } catch (error) {
      this.ready = this.vectors.size > 0;
      this.note = `Embedding failed, search degraded to keyword-only: ${
        error instanceof Error ? error.message : String(error)
      }`;
      return { embedded: 0, cached: this.vectors.size, skipped: true };
    }
  }

  /**
   * Rank models against a free-text query. `semantic` is weighted higher than
   * `lexical` when available, but lexical always contributes so an exact model
   * name never loses to a vaguely similar vector.
   */
  async search(
    query: string,
    options: { modality?: Modality; limit?: number; ids?: string[] } = {},
  ): Promise<SearchResult> {
    let pool = this.models;
    if (options.modality) pool = pool.filter((m) => m.modality === options.modality);
    if (options.ids) {
      const allow = new Set(options.ids);
      pool = pool.filter((m) => allow.has(m.id));
    }

    const limit = options.limit ?? 10;

    const trimmed = query.trim();
    if (!trimmed) {
      // No query is a browse, not a search: keep catalog order and apply the
      // same limit a query would. Silently returning everything made `limit`
      // a lie on the one call most likely to be made without one.
      return {
        hits: pool.slice(0, limit).map((model) => ({ model, score: 0, signals: { lexical: 0 } })),
        mode: this.ready ? 'hybrid' : 'lexical',
        note: this.note,
      };
    }

    let queryVector: number[] | null = null;
    if (this.ready && this.ai && this.vectors.size > 0) {
      try {
        queryVector = (await this.ai.embed([trimmed]))[0] ?? null;
      } catch {
        queryVector = null;
      }
    }

    const hits: SearchHit[] = pool.map((model) => {
      const lexical = lexicalScore(trimmed, model);
      const vector = this.vectors.get(model.id);
      if (queryVector && vector) {
        const semantic = cosine(queryVector, vector);
        return { model, score: semantic * 0.7 + lexical * 0.3, signals: { semantic, lexical } };
      }
      return { model, score: lexical, signals: { lexical } };
    });

    hits.sort((a, b) => b.score - a.score);
    return {
      hits: hits.slice(0, limit),
      mode: queryVector ? 'hybrid' : 'lexical',
      note: queryVector ? undefined : this.note,
    };
  }
}
