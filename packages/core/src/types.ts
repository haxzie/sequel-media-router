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
  | 'word-timestamps';

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
  | '1m_tokens';

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

export interface ImageOutput {
  kind: 'image';
  assets: Asset[];
}
export interface VideoOutput {
  kind: 'video';
  assets: Asset[];
}
export interface AudioOutput {
  kind: 'audio';
  assets: Asset[];
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
}

export interface UsageSummary {
  totalUsd: string;
  taskCount: number;
  byModality: Record<Modality, { usd: string; count: number }>;
  windowDays: number;
}

/** Per-model enablement, controlled from the Models page. */
export interface ModelState {
  id: string;
  enabled: boolean;
}
