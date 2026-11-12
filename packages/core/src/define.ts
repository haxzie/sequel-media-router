/**
 * Model definition factories.
 *
 * A model is declared once, here, with its zod input schema, its capabilities,
 * its published rates and its `run`. Everything downstream — the MCP tools, the
 * control panel, the embedding index, the cost estimator — reads that one
 * declaration. There is no second place to register a model.
 */
import { z } from 'zod/v4';
import type {
  Asset,
  Capability,
  Modality,
  ModelOutput,
  OutputFor,
  Rate,
  Runtime,
  Tag,
} from './types';
import type { CloudflareAI } from './cloudflare';

/** What a model's `run` is handed. Keeps models free of transport and storage detail. */
export interface RunContext {
  /** Cloudflare client: `run` for inference, `embed` for vectors. */
  ai: CloudflareAI;
  /**
   * Persist raw bytes and get back a URL. Models call this when a provider hands
   * back binary rather than a link, so every task ends with a fetchable asset.
   */
  storeAsset(input: { bytes: ArrayBuffer; mime: string; ext: string }): Promise<Asset>;
  signal?: AbortSignal;
}

/** The shape an author writes. `modality` is supplied by the factory, not by hand. */
export interface ModelDefinition<S extends z.ZodType, O extends ModelOutput> {
  /** Canonical id. `@cf/...` for Workers AI, `vendor/slug` for AI Gateway partners. */
  id: string;
  provider: string;
  name: string;
  /** One sentence. This is the "rough outline" `search_models` returns. */
  description: string;
  capabilities: Capability[];
  tags?: Tag[];
  /** Use cases and synonyms — the words a human would actually type. Feeds search. */
  keywords: string[];
  /** Published rates, cheapest first. Several when price varies by resolution. */
  rates: Rate[];
  runtime: Runtime;
  /**
   * True when a run takes long enough that `run_models` should return
   * `in_progress` and let the caller poll. Video is; image and audio are not.
   */
  async?: boolean;
  /** Rough p50 seconds. Advisory — used for ETA and ranking, never billed on. */
  etaSeconds: number;
  /** Where Cloudflare publishes this model's own JSON Schema, when it does. */
  schemaUrl?: string | null;
  /**
   * True when Cloudflare will not bill this model through unified billing and
   * the caller must supply their own provider key. Such a model is listed but
   * refused up front, rather than failing at the provider after a round trip.
   */
  requiresByok?: boolean;
  /** The input contract. Everything validates against this before any spend. */
  input: S;
  /**
   * Cost for a specific input. Omit to fall back to the generic estimator in
   * pricing.ts, which handles the common per-image / per-second / per-character
   * shapes from `rates`.
   */
  estimate?: (input: z.infer<S>) => string;
  run: (input: z.infer<S>, ctx: RunContext) => Promise<O>;
}

/** A registered model: its definition plus the behaviour everything downstream uses. */
export interface Model<
  S extends z.ZodType = z.ZodType,
  O extends ModelOutput = ModelOutput,
> extends ModelDefinition<S, O> {
  modality: Modality;
  /** Validate and coerce. Throws `z.ZodError` on bad input — callers map it to a 400. */
  parse(raw: unknown): z.infer<S>;
  /** JSON Schema for the MCP tool surface and the control panel's forms. */
  jsonSchema(): Record<string, unknown>;
  /** The text embedded for semantic search. Stable: changing it re-embeds. */
  searchText(): string;
}

/** Any model, regardless of its schema. What registries and tools hold. */
export type AnyModel = Model<z.ZodType, ModelOutput>;

/** zod v4's native JSON Schema emitter. Produces descriptions, defaults and bounds. */
function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, {
    io: 'input',
    unrepresentable: 'any',
  }) as Record<string, unknown>;
}

function build<S extends z.ZodType, O extends ModelOutput>(
  modality: Modality,
  def: ModelDefinition<S, O>,
): Model<S, O> {
  let cachedSchema: Record<string, unknown> | undefined;

  return {
    ...def,
    modality,
    parse: (raw) => def.input.parse(raw) as z.infer<S>,
    jsonSchema: () => (cachedSchema ??= toJsonSchema(def.input)),
    searchText: () =>
      [
        def.name,
        def.provider,
        modality,
        def.description,
        def.capabilities.join(' '),
        (def.tags ?? []).join(' '),
        def.keywords.join(' '),
      ]
        .filter(Boolean)
        .join('. '),
  };
}

/**
 * Define a model of any modality. Prefer the per-modality factories below —
 * they pin the output type so a video model cannot accidentally return images.
 */
export function createModel<S extends z.ZodType, O extends ModelOutput>(
  modality: Modality,
  def: ModelDefinition<S, O>,
): Model<S, O> {
  return build(modality, def);
}

export function createImageModel<S extends z.ZodType>(
  def: ModelDefinition<S, OutputFor['image']>,
): Model<S, OutputFor['image']> {
  return build('image', def);
}

export function createVideoModel<S extends z.ZodType>(
  def: ModelDefinition<S, OutputFor['video']>,
): Model<S, OutputFor['video']> {
  return build('video', def);
}

export function createAudioModel<S extends z.ZodType>(
  def: ModelDefinition<S, OutputFor['audio']>,
): Model<S, OutputFor['audio']> {
  return build('audio', def);
}
