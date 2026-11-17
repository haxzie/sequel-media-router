import {
  SequelError,
  type ModelSchema,
  type ModelSummary,
  type Modality,
  type Task,
  type TaskStatus,
  type UploadTarget,
} from './types';

export interface SequelOptions {
  /** Defaults to SEQUEL_API_KEY. */
  apiKey?: string;
  /** Defaults to SEQUEL_BASE_URL, then the hosted API. */
  baseUrl?: string;
  /** Swapped in tests. Defaults to global fetch. */
  fetch?: typeof fetch;
  /**
   * A default toolset for `tools()`. Typed loosely here on purpose: core
   * must not import any agent framework, or installing the AI SDK adapter
   * would change what a LangChain user pulls down.
   */
  toolset?: Toolset;
}

/**
 * Turns catalogue entries into whatever a framework calls a tool.
 *
 * One method, so an adapter is a file rather than a dependency graph.
 */
export interface Toolset<T = unknown> {
  build(context: ToolsetContext): Promise<Record<string, T>> | Record<string, T>;
}

export interface ToolsetContext {
  client: Sequel;
  /** Empty in discovery mode; the filtered models in per-model mode. */
  models: ModelSummary[];
  schemas: Record<string, ModelSchema>;
  mode: 'discovery' | 'per-model';
}

export interface SearchOptions {
  query?: string;
  type?: Modality;
  limit?: number;
}

export interface RunOptions {
  model: string;
  /** The model's own input object. `prompt` for most, `text` for speech. */
  params?: Record<string, unknown>;
  /**
   * Shorthand folded into params.prompt.
   *
   * Deliberately separate from params rather than hoisted over it: most
   * models take `prompt`, but text-to-speech takes `text`, so a top-level
   * prompt cannot be assumed to belong anywhere.
   */
  prompt?: string;
  signal?: AbortSignal;
}

export interface ListTasksOptions {
  status?: TaskStatus[];
  models?: string[];
  start?: string;
  end?: string;
  limit?: number;
}

export interface WaitOptions {
  /** Give up after this long. Default five minutes. */
  timeout?: number;
  /** First gap between polls, doubling to 5s. Default 1s. */
  interval?: number;
  signal?: AbortSignal;
}

const DEFAULT_BASE_URL = 'https://api.sequel.sh';

/** A task you can await, for the models that do not finish inside the request. */
export class TaskHandle {
  constructor(
    private readonly client: Sequel,
    public task: Task,
  ) {}

  get id(): string {
    return this.task.task_id;
  }

  get done(): boolean {
    return this.task.status === 'completed' || this.task.status === 'failed';
  }

  /**
   * Poll until it settles.
   *
   * Video is asynchronous, and without this every caller writes the same
   * loop. Webhooks remain the production answer; this is for scripts.
   */
  async wait(options: WaitOptions = {}): Promise<Task> {
    const timeout = options.timeout ?? 5 * 60_000;
    const deadline = Date.now() + timeout;
    let gap = options.interval ?? 1000;

    while (!this.done) {
      if (Date.now() > deadline) {
        throw new SequelError(`Task ${this.id} did not finish within ${timeout}ms.`, 408, this.task);
      }
      await new Promise((resolve) => setTimeout(resolve, gap));
      if (options.signal?.aborted) throw new SequelError('Aborted.', 499, this.task);
      gap = Math.min(gap * 2, 5000);
      this.task = await this.client.tasks.get(this.id);
    }

    return this.task;
  }
}

export class Sequel {
  readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly doFetch: typeof fetch;
  private readonly defaultToolset: Toolset | undefined;

  constructor(options: SequelOptions = {}) {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
      ?.env;

    this.apiKey = options.apiKey ?? env?.SEQUEL_API_KEY;
    this.baseUrl = (options.baseUrl ?? env?.SEQUEL_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.doFetch = options.fetch ?? globalThis.fetch;
    this.defaultToolset = options.toolset;
  }

  // ------------------------------------------------------------------ models

  /** Find models by use case, or list the catalogue by omitting the query. */
  async search(options: SearchOptions = {}): Promise<ModelSummary[]> {
    const query = new URLSearchParams();
    if (options.query) query.set('q', options.query);
    if (options.type) query.set('type', options.type);
    if (options.limit) query.set('limit', String(options.limit));

    const path = query.size ? `/api/models?${query}` : '/api/models';
    const body = await this.request<{ models: ModelSummary[] }>('GET', path);
    return body.models ?? [];
  }

  /** A model's input schema, capabilities and rates. */
  async schema(model: string): Promise<ModelSchema> {
    return this.request<ModelSchema>('GET', `/api/models/${encodeURIComponent(model)}/schema`);
  }

  // -------------------------------------------------------------------- runs

  /**
   * Run a model.
   *
   * Image and audio come back finished. Video comes back in_progress with a
   * task id — call `.wait()` on the handle, or take the webhook.
   */
  async run(options: RunOptions): Promise<TaskHandle> {
    const params = { ...(options.params ?? {}) };
    if (options.prompt !== undefined && params.prompt === undefined) {
      params.prompt = options.prompt;
    }

    const task = await this.request<Task>(
      'POST',
      '/api/tasks',
      { model: options.model, input: params },
      options.signal,
    );

    return new TaskHandle(this, task);
  }

  /** Run several at once. They go in parallel and come back in order. */
  async runMany(runs: RunOptions[]): Promise<TaskHandle[]> {
    return Promise.all(runs.map((run) => this.run(run)));
  }

  readonly tasks = {
    get: async (id: string): Promise<Task> =>
      this.request<Task>('GET', `/api/tasks/${encodeURIComponent(id)}`),

    list: async (options: ListTasksOptions = {}): Promise<Task[]> => {
      const query = new URLSearchParams();
      for (const status of options.status ?? []) query.append('status', status);
      for (const model of options.models ?? []) query.append('model', model);
      if (options.start) query.set('start', options.start);
      if (options.end) query.set('end', options.end);
      if (options.limit) query.set('limit', String(options.limit));

      const body = await this.request<{ tasks: Task[] }>(
        'GET',
        query.size ? `/api/tasks?${query}` : '/api/tasks',
      );
      return body.tasks ?? [];
    },
  };

  // ----------------------------------------------------------------- uploads

  /** A URL to PUT bytes to, and the URL they will be readable from. */
  async uploadUrl(contentType: string, extension?: string): Promise<UploadTarget> {
    return this.request<UploadTarget>('POST', '/api/upload', {
      content_type: contentType,
      ...(extension ? { extension } : {}),
    });
  }

  /**
   * Upload and return the URL a model can read it from.
   *
   * Reference images are the common case and nobody wants to write the PUT.
   */
  async upload(file: Blob, options: { extension?: string } = {}): Promise<string> {
    const target = await this.uploadUrl(file.type || 'application/octet-stream', options.extension);

    const put = await this.doFetch(target.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'content-type': file.type || 'application/octet-stream' },
    });
    if (!put.ok) {
      throw new SequelError(`Upload failed (${put.status}).`, put.status, await put.text());
    }

    return target.fileUrl;
  }

  // ------------------------------------------------------------------- tools

  /** Build agent tools with the configured toolset, or one passed here. */
  async tools<T = unknown>(
    options: {
      models?: string[];
      type?: Modality | Modality[];
      mode?: 'discovery' | 'per-model';
      toolset?: Toolset<T>;
    } = {},
  ): Promise<Record<string, T>> {
    const toolset = (options.toolset ?? this.defaultToolset) as Toolset<T> | undefined;
    if (!toolset) {
      throw new SequelError(
        'No toolset. Pass one to the constructor, or to tools({ toolset }).',
        400,
        null,
      );
    }

    const mode = options.mode ?? 'discovery';

    /*
     * Discovery needs no catalogue up front — that is the point of it. The
     * three tools cost the same whether we serve twenty models or two
     * thousand, and the agent looks things up when it needs them.
     */
    if (mode === 'discovery') {
      return toolset.build({ client: this, models: [], schemas: {}, mode });
    }

    const types = options.type
      ? Array.isArray(options.type)
        ? options.type
        : [options.type]
      : [undefined];

    const found = (
      await Promise.all(types.map((type) => this.search(type ? { type } : {})))
    ).flat();

    const models = options.models?.length
      ? found.filter((model) => options.models!.includes(model.id))
      : found;

    const schemas: Record<string, ModelSchema> = {};
    await Promise.all(
      models.map(async (model) => {
        schemas[model.id] = await this.schema(model.id);
      }),
    );

    return toolset.build({ client: this, models, schemas, mode });
  }

  // ----------------------------------------------------------------- request

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await this.doFetch(`${this.baseUrl}${path}`, {
      method,
      ...(signal ? { signal } : {}),
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      const detail = parsed as { error_description?: string; error?: string } | null;
      throw new SequelError(
        detail?.error_description ?? detail?.error ?? `Request failed (${response.status}).`,
        response.status,
        parsed,
      );
    }

    return parsed as T;
  }
}
