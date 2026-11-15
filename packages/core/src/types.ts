/**
 * Core vocabulary for Composio Forge.
 *
 * A narrowed subset of `spec/models.types.ts` — same words, same meanings, fewer
 * of them. Anything shared with that file keeps its semantics, so this POC can
 * grow into that surface rather than fight it.
 */

/** The three modalities this POC serves. */
export type Modality = 'image' | 'video' | 'audio';

/**
 * What a model can actually *do*. Functional only — speed and quality live in
 * `tags`, because mixing them makes the list unusable for filtering.
 */
export type Capability =
  // image
  | 'text-to-image'
  | 'image-to-image'
  | 'image-editing'
  | 'inpainting'
  | 'style-reference'
  | 'text-rendering'
  | 'transparent-background'
  | 'upscale'
  // video
  | 'text-to-video'
  | 'image-to-video'
  | 'video-extend'
  | 'synced-audio'
  // audio
  | 'text-to-speech'
  | 'voice-selection'
  | 'voice-cloning'
  | 'emotion-control'
  | 'multilingual'
  | 'speech-to-text'
  | 'diarization'
  | 'word-timestamps'
  // music
  | 'text-to-music'
  | 'lyrics'
  | 'instrumental';

/** Non-functional descriptors. Used for ranking and display, never for filtering correctness. */
export type Tag = 'fast' | 'cheap' | 'high-fidelity' | 'preview' | 'open-weights';

/** Providers bill in incompatible units, so the unit travels with the number. */
export type PriceUnit =
  | 'image'
  | 'second'
  | 'tile_512'
  | 'step'
  | 'character'
  | '1k_characters'
  | 'minute'
  | 'call'
  | 'megapixel'
  | '1m_tokens'
  /** A whole generated item priced flat, regardless of length. */
  | 'track'
  | 'clip';

export interface Rate {
  unit: PriceUnit;
  /** Decimal string. Never a float — this is money. */
  usd: string;
  /** Qualifier this rate applies at, e.g. `@1080p w/ audio`. */
  qualifier?: string;
}

/** Where a model physically runs, which decides the request shape. */
export type Runtime =
  /** Workers AI native: `@cf/vendor/slug`, POSTed to `/ai/run/{id}`. */
  | 'workers-ai'
  /** Partner model behind AI Gateway: `vendor/slug`, POSTed to `/ai/run` as `{model, input}`. */
  | 'ai-gateway';

/** A produced file. */
export interface Asset {
  url: string;
  mime: string;
  bytes?: number;
  /** Set when we stored it ourselves rather than linking the provider's URL. */
  key?: string;
  /** Transcription text, for speech-to-text models. */
  text?: string;
}

/**
 * Every output carries the untouched provider payload. It is what makes a
 * surprising result diagnosable without re-running (and re-paying for) the job.
 */
interface BaseOutput {
  assets: Asset[];
  raw?: unknown;
}

export interface ImageOutput extends BaseOutput {
  kind: 'image';
}
export interface VideoOutput extends BaseOutput {
  kind: 'video';
}
export interface AudioOutput extends BaseOutput {
  kind: 'audio';
  /** Present for speech-to-text. */
  transcript?: string;
}

export type ModelOutput = ImageOutput | VideoOutput | AudioOutput;

/** Maps a modality to the output its models must return. Enforced by the factories. */
export interface OutputFor {
  image: ImageOutput;
  video: VideoOutput;
  audio: AudioOutput;
}

export type TaskStatus = 'queued' | 'in_progress' | 'completed' | 'failed';

/**
 * Who asked for a run, and through which door.
 *
 * Denormalised on purpose. The task store has no access to the auth tables —
 * core knows nothing about users — and a task list that had to join against
 * them to render a name would couple the two for the sake of a label. The
 * snapshot is what was true when the run started, which is also the honest
 * thing to show later if the person is renamed or removed.
 */
export interface TaskActor {
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  /** Which credential authorised it. */
  via: 'session' | 'api_key' | 'oauth';
  /** Set when `via` is api_key, so a run can be traced to one key. */
  apiKeyId?: string;
  organizationId?: string;
}

export interface Task {
  id: string;
  model: string;
  modality: Modality;
  status: TaskStatus;
  /** Prompt or short description, for the task list. */
  label: string;
  input: Record<string, unknown>;
  resultUrl?: string;
  assets?: Asset[];
  /** Estimated at submit; replaced by the actual where a provider reports one. */
  costUsd: string;
  costEstimated: boolean;
  error?: string;
  createdAt: string;
  completedAt?: string;
  /** Untouched provider payload, so the abstraction is never the only path. */
  raw?: unknown;
  /** Absent on runs made before attribution existed, or by an unauthenticated caller. */
  createdBy?: TaskActor;
  /**
   * The organisation this run belongs to, and the only thing that scopes it.
   *
   * Absent means nobody's: a run made with no credential has no team to file
   * it under, so it is visible to no organisation rather than to all of them.
   */
  organizationId?: string;
}

export interface UsageSummary {
  totalUsd: string;
  taskCount: number;
  byModality: Record<Modality, { usd: string; count: number }>;
  windowDays: number;
}

/**
 * A short, stable handle for a stored object.
 *
 * Presigned URLs run to ~400 characters and expire. An agent relaying one into
 * the next tool call pays ~100 tokens for it and gets a link that dies in a
 * week. The alias is ~10 characters, never expires, and resolves to a freshly
 * signed URL on each fetch.
 */
export interface AssetAlias {
  id: string;
  key: string;
  mime: string;
  createdAt: string;
}

/** Per-model enablement, controlled from the Models page. */
export interface ModelState {
  id: string;
  enabled: boolean;
}
