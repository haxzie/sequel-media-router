/**
 * Proposed public surface for `composio.models` — "describe a use case, get models, create".
 *
 * Written to drop into `@composio/core` beside `src/types/tool.types.ts`, following the
 * same conventions: camelCase in the SDK, snake_case on the wire, zod at the boundary,
 * `requestOptions` trailing every method.
 *
 * Shaped by the teardown of fal's and Higgsfield's MCP servers in docs/03-mcp-teardown.md:
 *   - search results carry their invocation schema (Higgsfield) — no mandatory second call
 *   - media inputs are named slots with roles (Higgsfield)
 *   - every result carries a replayable recipe (fal)
 *   - creation has a bounded wait (fal)
 *   - hard constraints FILTER rather than rank, and exclusions are reported (neither)
 *   - prices are committed quotes rather than advisory (neither)
 *
 * Status: design sketch, typechecks under --strict. Not wired to a backend.
 */

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export type Modality =
  | 'image' | 'video' | 'audio' | 'speech' | 'music' | '3d' | 'transcription';

export type Capability =
  | 'text-to-image' | 'image-to-image' | 'inpainting' | 'outpainting' | 'upscale'
  | 'background-removal' | 'text-to-video' | 'image-to-video' | 'video-to-video'
  | 'video-extension' | 'lipsync' | 'text-to-speech' | 'speech-to-speech'
  | 'voice-clone' | 'text-to-music' | 'text-to-sfx' | 'speech-to-text' | 'image-to-3d';

export interface Range { min: number; max: number }

/**
 * The machine-checkable hard limits. `requires` on a search is matched against this and
 * a violation EXCLUDES the model — it is never merely scored down.
 */
export interface Envelope {
  durationSeconds?: Range;
  resolutions?: string[];
  aspectRatios?: string[];
  /** The model emits synced audio itself, vs. a silent render needing a second pass. */
  audio?: boolean;
  maxOutputs?: number;
  languages?: string[];
  maxInputBytes?: number;
}

/** A named media input slot. Roles generalize where a fixed field per input does not. */
export type MediaSlotName =
  | 'startImage' | 'endImage' | 'references' | 'sourceImage' | 'sourceVideo'
  | 'sourceAudio' | 'maskImage' | 'voiceSample' | 'styleReference';

export interface MediaSlot {
  slot: MediaSlotName;
  accepts: Array<'image' | 'video' | 'audio'>;
  required?: boolean;
  max?: number;
  description?: string;
}

export interface Price {
  /** 'image' | 'second' | 'minute' | 'megapixel' | '1k_characters' | 'call' */
  unit: string;
  /** Decimal string. Never a float — this is money. */
  usd: string;
  /**
   * True when Composio will honour a quote derived from this rate. False means the model
   * is advisory-priced only, and a strict `maxCostUsd` rejects it rather than guessing.
   */
  committed: boolean;
  notes?: string;
}

export interface Model {
  /** `<provider>/<model>`, stable across provider-side renames. */
  id: string;
  /** An existing Composio toolkit slug, e.g. `fal_ai`, `luma_labs`, `elevenlabs`. */
  provider: string;
  name: string;
  description: string;
  modality: Modality;
  capabilities: Capability[];
  envelope: Envelope;
  media: MediaSlot[];
  schema: {
    /** The canonical schema id, shared by every model of this modality: `video.create@1`. */
    canonical: string;
    /** Canonical fields this model ignores. Passing one yields a warning, not an error. */
    unsupported?: string[];
    /** JSON Schema for the provider-specific escape hatch. */
    providerOptions?: Record<string, unknown>;
  };
  price: Price;
  latency: { p50Seconds: number; p95Seconds?: number; mode: 'sync' | 'async' };
  /** Runnable on Composio's own provider account — no user API key. Per-model Instant. */
  instant: { supported: boolean };
  byok: { supported: boolean; authConfig?: string };
  /** Dated toolkit version, same convention as tools. */
  version: string;
  status: 'ga' | 'preview' | 'deprecated';
  supersededBy?: string;
  provenance?: { c2pa?: boolean; visibleWatermark?: boolean };
}

// ---------------------------------------------------------------------------
// Search: soft query + hard constraints
// ---------------------------------------------------------------------------

/** Hard constraints. Boolean, checked against `Envelope`. Violators are excluded. */
export interface Requires {
  modality?: Modality;
  capabilities?: Capability[];
  durationSeconds?: number;
  resolution?: string;
  aspectRatio?: string;
  audio?: boolean;
  outputs?: number;
  languages?: string[];
  /** Only models runnable without the user's own API key. */
  instant?: boolean;
  providers?: string[];
  excludeProviders?: string[];
  status?: Model['status'][];
}

export interface ModelSearchParams {
  /** Soft: the use case, in the developer's or the user's own words. Semantic. */
  query: string;
  /** Hard: what the model must be able to do. Never scored — only filtered. */
  requires?: Requires;
  /** Compared against the per-request quote, not the headline rate. */
  maxCostUsd?: string;
  maxLatencyP95Seconds?: number;
  prefer?: 'cheapest' | 'fastest' | 'best' | 'balanced';
  limit?: number;
  cursor?: string;
}

/** Priced for the specific request. `bounded: false` means it cannot be capped. */
export interface Quote {
  maxUsd: string;
  expectedUsd?: string;
  etaSeconds: number;
  bounded: boolean;
}

export interface ModelSearchResult {
  model: Model;
  quote: Quote;
  /**
   * The request's constraints already mapped into this model's canonical input, so the
   * next call is `create({ ...result.call, input: { ...result.call.input, prompt } })`.
   * This is what collapses discovery and invocation into two calls instead of three.
   */
  call: { model: string; input: Record<string, unknown> };
  /** Itemized, auditable reasons this model qualified. Never a bare score. */
  why: string[];
  /** Model-specific gotchas: ignored fields, billing quirks, prompt sensitivities. */
  pitfalls?: string[];
  /** Usable but not yet runnable — e.g. the provider needs connecting. */
  blockers?: Array<{
    kind: 'not_connected' | 'policy' | 'balance';
    message: string;
    /** For `not_connected`: hand this to COMPOSIO_MANAGE_CONNECTIONS. */
    resolveWith?: string;
  }>;
}

export interface ModelSearchResponse {
  /** Only candidates satisfying every `requires` and `maxCostUsd`. */
  results: ModelSearchResult[];
  considered: number;
  /**
   * Every candidate dropped, and why. This is what makes the filter trustworthy: a
   * developer can verify there is no thumb on the scale, and an agent can explain itself.
   */
  excluded: Array<{ model: string; reason: string }>;
  /**
   * What would open up if a constraint were relaxed. Keeps a strict filter from being a
   * dead end — an empty result with no path forward is how an agent gives up or invents
   * a model id.
   */
  relaxations?: Array<{
    drop?: keyof Requires;
    raise?: 'maxCostUsd' | 'maxLatencyP95Seconds';
    to?: string;
    wouldAdd: number;
    cheapestUsd?: string;
  }>;
  nextStepsGuidance: string[];
  nextCursor?: string;
}

// ---------------------------------------------------------------------------
// Creating
// ---------------------------------------------------------------------------

export type MediaRef =
  | string                   // https:// URL or data: URI
  | { s3key: string }        // an existing Composio file
  | { path: string }         // local path, behind the existing upload denylist
  | { artifactId: string }   // a previous generation — no download/re-upload
  | Blob;

/** Keys match `Model['media'][].slot`. */
export type MediaInputs = Partial<Record<MediaSlotName, MediaRef | MediaRef[]>>;

export interface ImageCreateInput {
  prompt: string;
  negativePrompt?: string;
  media?: MediaInputs;
  aspectRatio?: string;
  size?: { width: number; height: number };
  outputs?: number;
  seed?: number;
}

export interface VideoCreateInput {
  prompt?: string;
  media?: MediaInputs;
  durationSeconds?: number;
  resolution?: string;
  aspectRatio?: string;
  fps?: number;
  /** Ask for synced audio. Warns when `envelope.audio !== true`. */
  audio?: boolean;
  seed?: number;
}

export interface SpeechCreateInput {
  text: string;
  voice?: string | { id: string; provider?: string };
  media?: MediaInputs;          // e.g. { voiceSample } for cloning
  language?: string;
  speed?: number;
  format?: 'mp3' | 'wav' | 'pcm' | 'opus';
}

export interface TranscribeInput {
  media: MediaInputs;           // { sourceAudio } or { sourceVideo }
  language?: string;
  diarize?: boolean;
  timestamps?: 'none' | 'word' | 'segment';
}

export type CreateInput =
  | ImageCreateInput | VideoCreateInput | SpeechCreateInput | TranscribeInput
  | Record<string, unknown>;

/** A use case in place of a model id: search and create fused into one call. */
export interface ModelIntent {
  modality: Modality;
  prefer?: 'cheapest' | 'fastest' | 'best' | 'balanced';
  requires?: Requires;
  maxCostUsd?: string;
  /** Tried in order when the primary choice fails (provider outage, capacity). */
  fallback?: string[];
  /** Freeze a validated choice, keeping `requires` as documentation and a tripwire. */
  pin?: string;
}

export interface CreateParams {
  /** Omitted when called on a session — the session supplies it. */
  userId?: string;
  /** A model id, an intent, or the `'image' | 'video' | …` shorthand for a balanced intent. */
  model: string | ModelIntent | Modality;
  input: CreateInput;
  /** Namespaced by provider, so retargeting a call never strips anything. */
  providerOptions?: Record<string, Record<string, unknown>>;
  /** Hard pre-flight cap checked against the quote. Rejects before spending. */
  maxCostUsd?: string;
  /**
   * `'block'` waits to a terminal state (default, `timeoutSeconds`).
   * `'brief'` waits ~25s then returns a job id + ETA — the right agent default.
   * `'none'` returns in ~200ms; completion arrives by webhook/trigger.
   */
  wait?: 'block' | 'brief' | 'none';
  timeoutSeconds?: number;
  webhookUrl?: string;
  /** In media a retry is a purchase. A duplicate key returns the original generation. */
  idempotencyKey?: string;
  /** `{ store: false }` redacts `recipe.input` for sensitive prompts. */
  recipe?: { store: boolean };
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface Artifact {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'model3d' | 'text';
  mimeType: string;
  /** Durable, in Composio's own store. Accepted anywhere a `MediaRef` is. */
  s3key: string;
  url: string;
  urlExpiresAt: string;
  bytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  sampleRate?: number;
  /** Where the session sandbox reads it, when artifact mounting is on. */
  sandboxPath?: string;
  provenance?: { c2pa?: boolean; watermark?: 'visible' | 'invisible' | 'none' };
  moderation?: { flagged: boolean; categories?: string[] };
  /** For `kind: 'text'` — transcripts, captions, composition plans. */
  text?: string;
}

export interface Warning {
  code: 'unsupported_field' | 'clamped_value' | 'fallback_used' | 'estimate_only' | 'moderated';
  message: string;
  field?: string;
}

/** Same accounting as search, so a fused search-and-create stays auditable. */
export interface RoutingDecision {
  considered: number;
  chose: string;
  why: string[];
  excluded: Array<{ model: string; reason: string }>;
  fellBackFrom?: string;
}

/** Replayable, diffable, shareable — the unit a "regenerate with one tweak" UI is built on. */
export interface Recipe {
  model: string;
  canonical: string;
  input?: Record<string, unknown>;
  inputOmitted?: boolean;
}

export interface Generation {
  id: string;
  /** The model that actually ran. Always read this under an intent. */
  model: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled' | 'blocked';
  progress?: { percent?: number; stage?: string };
  artifacts: Artifact[];
  cost?: { usd: string; source: 'instant' | 'byok_unmetered'; quotedUsd?: string };
  timings: { queuedAt: string; startedAt?: string; completedAt?: string; seconds?: number };
  warnings: Warning[];
  recipe?: Recipe;
  routing?: RoutingDecision;
  /** Same `logId` as any tool execution → visible in `composio.logs`. */
  logId: string;
  /** Set while `status` is queued/running, so an agent can poll on a sane cadence. */
  etaSeconds?: number;
  pollAfterSeconds?: number;
  error?: { code: string; message: string; retryable: boolean };
  blockReason?: { type: string; hookId?: string };
  /** The untouched provider payload. Always present; the abstraction is never the only path. */
  raw?: unknown;

  wait(options?: { timeoutSeconds?: number }): Promise<Generation>;
  cancel(): Promise<Generation>;
}

// ---------------------------------------------------------------------------
// The namespace
// ---------------------------------------------------------------------------

export interface ModelsNamespace {
  /** Use case in, invocable model cards out. The headline call. */
  search(params: ModelSearchParams, requestOptions?: unknown): Promise<ModelSearchResponse>;
  /** Structured browse with no semantic query. */
  list(requires?: Requires, requestOptions?: unknown): Promise<{ items: Model[]; nextCursor?: string }>;
  get(modelId: string, requestOptions?: unknown): Promise<Model>;

  /** A committed price for a specific call, without running it. */
  quote(params: CreateParams, requestOptions?: unknown): Promise<Quote & { model: string }>;
  /** Resolve an intent without executing. A router you can't dry-run is unshippable. */
  route(params: Pick<CreateParams, 'model' | 'input'>, requestOptions?: unknown): Promise<RoutingDecision>;

  /** Create. `wait` decides whether this blocks, waits briefly, or returns immediately. */
  create(params: CreateParams, requestOptions?: unknown): Promise<Generation>;

  generations: {
    get(generationId: string): Promise<Generation>;
    list(filters?: { status?: Generation['status']; userId?: string }): Promise<{ items: Generation[] }>;
    cancel(generationId: string): Promise<Generation>;
  };
}

/** Session policy, in the existing enable/disable/requireApproval grammar. */
export interface SessionModelsPolicy {
  modalities?: { enable?: Modality[] } | { disable?: Modality[] };
  providers?: { enable?: string[] } | { disable?: string[] };
  models?: { enable?: string[] } | { disable?: string[] };
  budget?: {
    maxUsdPerCall?: string;
    maxUsdPerSession?: string;
    onExceeded?: 'block' | 'require_approval';
  };
  limits?: Partial<Record<Modality, Partial<Envelope>>>;
  /** Modalities needing a human → the existing `ComposioToolInputRequiredError` flow. */
  requireApproval?: Modality[];
  artifacts?: { store?: 'composio' | 'provider'; retentionDays?: number; mount?: string };
}
