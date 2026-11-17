/** Modalities the catalogue is divided into. */
export type Modality = 'image' | 'video' | 'audio';

export type TaskStatus = 'queued' | 'in_progress' | 'completed' | 'failed';

export interface Rate {
  unit: string;
  usd: string;
  qualifier?: string;
}

export interface ModelSummary {
  id: string;
  name: string;
  provider: string;
  modality: Modality;
  description: string;
  capabilities: string[];
  tags?: string[];
  price?: string;
  rates?: Rate[];
}

export interface ModelSchema {
  id: string;
  modality: Modality;
  capabilities: string[];
  /** JSON Schema for this model's `params`. */
  inputSchema: Record<string, unknown>;
  rates?: Rate[];
}

export interface Asset {
  url: string;
  mime: string;
  bytes?: number;
  text?: string;
}

export interface Cost {
  usd: string;
  estimated: boolean;
  basis?: string;
}

export interface Task {
  task_id: string;
  status: TaskStatus;
  model?: string;
  result_url?: string;
  assets?: Asset[];
  cost?: Cost;
  eta_seconds?: number;
  error?: string;
  created_at?: string;
  completed_at?: string;
}

export interface UploadTarget {
  key: string;
  uploadUrl: string;
  fileUrl: string;
  expiresInSeconds: number;
  driver: 'r2' | 'local';
}

/** Thrown for any non-2xx response, with the status and the server's message. */
export class SequelError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'SequelError';
  }
}
