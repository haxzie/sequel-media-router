/**
 * The Forge service: the five tools, implemented once.
 *
 * The MCP endpoint and the control panel's REST routes are both thin wrappers
 * over this object. Keeping one implementation is what stops the agent-facing
 * and human-facing surfaces from drifting apart.
 */
import { z } from 'zod/v4';
import type { CloudflareAI } from './cloudflare';
import type { AnyModel, RunContext } from './define';
import { EmbeddingIndex } from './embeddings';
import { estimateCost, addMoney, type CostEstimate } from './pricing';
import type { ModelRegistry } from './registry';
import type { Store } from './storage';
import type { Uploads } from './uploads';
import type {
  Asset,
  AssetAlias,
  Modality,
  Task,
  TaskActor,
  TaskStatus,
  UsageSummary,
} from './types';

export interface ForgeOptions {
  registry: ModelRegistry;
  store: Store;
  uploads: Uploads;
  ai: CloudflareAI | null;
  /** Public origin, used to build short asset links. */
  baseUrl: string;
  /** Hook for Workers' `ctx.waitUntil`. Defaults to a floating promise. */
  waitUntil?: (promise: Promise<unknown>) => void;
  /**
   * Called once a task reaches a terminal state, for anything that wants to
   * react — webhooks today.
   *
   * A hook rather than a direct dependency: core knows nothing about D1, HTTP
   * endpoints or organisations, and it should not learn about them to deliver
   * a notification. Failures here are swallowed by the caller; a broken
   * listener must not be able to fail a run that already succeeded.
   */
  onTaskSettled?: (task: Task) => void | Promise<void>;
}

/** ~10 chars of base62. Collision risk is negligible at POC volumes. */
function shortId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** A model as `search_models` reports it. */
export interface ModelSummary {
  id: string;
  name: string;
  provider: string;
  modality: Modality;
  description: string;
  capabilities: string[];
  tags: string[];
  /** Headline rate, pre-formatted: "$0.20 / second @720p". */
  price: string;
  rates: Array<{ unit: string; usd: string; qualifier?: string }>;
  etaSeconds: number;
  async: boolean;
  enabled: boolean;
  /** Needs a caller-supplied provider key; not runnable on unified billing. */
  requiresByok: boolean;
  /** Only present on search results. */
  score?: number;
}

function priceLabel(model: AnyModel): string {
  const rate = model.rates[0];
  if (!rate) return 'unpriced';
  return `$${rate.usd} / ${rate.unit}${rate.qualifier ? ` ${rate.qualifier}` : ''}`;
}

export class Forge {
  private index: EmbeddingIndex;
  private indexBuilt: Promise<unknown> | null = null;

  constructor(private readonly opts: ForgeOptions) {
    this.index = new EmbeddingIndex(opts.registry.list(), opts.ai, opts.store);
  }

  /**
   * Build the embedding index. Called once at server start; idempotent, so a
   * second call during hot reload is cheap.
   */
  async ready(): Promise<void> {
    this.indexBuilt ??= this.index.build();
    await this.indexBuilt;
  }

  /**
   * Register a short handle for a stored object and return its link.
   *
   * The presigned alternative is ~400 characters and expires in days. This is
   * ~35, never expires, and re-signs on each fetch — which matters because an
   * agent relays these URLs between tool calls and pays tokens for every one.
   */
  private async shorten(asset: Asset): Promise<Asset> {
    if (!asset.key) return asset;
    const alias: AssetAlias = {
      id: shortId(),
      key: asset.key,
      mime: asset.mime,
      createdAt: new Date().toISOString(),
    };
    await this.opts.store.putAlias(alias);
    return { ...asset, url: `${this.opts.baseUrl.replace(/\/$/, '')}/f/${alias.id}` };
  }

  /**
   * Store bytes we were handed and return them with a short link.
   *
   * The same path a model's output takes, so a file someone attaches in chat
   * is addressed exactly like one a model produced — and can therefore be fed
   * straight back in as `file_url` on the next run.
   */
  async storeAsset(opts: { bytes: ArrayBuffer; mime: string; ext: string }): Promise<Asset> {
    return this.shorten(await this.opts.uploads.put(opts));
  }

  /** Resolve a short handle to a directly-fetchable URL. */
  async resolveAlias(id: string): Promise<{ url: string; mime: string } | undefined> {
    const alias = await this.opts.store.getAlias(id);
    if (!alias) return undefined;
    return { url: await this.opts.uploads.readUrl(alias.key), mime: alias.mime };
  }

  private async enabledIds(): Promise<Set<string>> {
    const states = await this.opts.store.getModelStates();
    const disabled = new Set(states.filter((s) => !s.enabled).map((s) => s.id));
    return new Set(
      this.opts.registry
        .list()
        .map((m) => m.id)
        .filter((id) => !disabled.has(id)),
    );
  }

  private async summarise(model: AnyModel, score?: number): Promise<ModelSummary> {
    const enabled = (await this.enabledIds()).has(model.id);
    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      modality: model.modality,
      description: model.description,
      capabilities: model.capabilities,
      tags: model.tags ?? [],
      price: priceLabel(model),
      rates: model.rates,
      etaSeconds: model.etaSeconds,
      async: model.async ?? false,
      requiresByok: model.requiresByok ?? false,
      enabled,
      ...(score === undefined ? {} : { score: Number(score.toFixed(4)) }),
    };
  }

  // ---------------------------------------------------------------- tool 1
  async searchModels(params: {
    type?: Modality;
    query?: string;
    limit?: number;
    includeDisabled?: boolean;
  }): Promise<{ models: ModelSummary[]; mode: string; note?: string }> {
    await this.ready();
    const enabled = await this.enabledIds();
    const ids = params.includeDisabled ? undefined : [...enabled];

    const result = await this.index.search(params.query ?? '', {
      modality: params.type,
      limit: params.limit ?? 10,
      ids,
    });

    const models = await Promise.all(
      result.hits.map((hit) => this.summarise(hit.model, params.query ? hit.score : undefined)),
    );
    return { models, mode: result.mode, note: result.note };
  }

  // ---------------------------------------------------------------- tool 2
  async getModelSchemas(params: { model: string }): Promise<{
    id: string;
    modality: Modality;
    capabilities: string[];
    inputSchema: Record<string, unknown>;
    /** Cloudflare's own published schema, when it has one. */
    upstreamSchemaUrl?: string | null;
    rates: Array<{ unit: string; usd: string; qualifier?: string }>;
  }> {
    const model = this.opts.registry.require(params.model);
    return {
      id: model.id,
      modality: model.modality,
      capabilities: model.capabilities,
      inputSchema: model.jsonSchema(),
      upstreamSchemaUrl: model.schemaUrl ?? null,
      rates: model.rates,
    };
  }

  // ---------------------------------------------------------------- tool 3
  async getUploadUrl(params: { content_type: string; extension?: string }) {
    const target = await this.opts.uploads.createUploadUrl({
      contentType: params.content_type,
      extension: params.extension,
    });
    const short = await this.shorten({
      url: target.fileUrl,
      mime: params.content_type,
      key: target.key,
    });
    return {
      file_url: short.url,
      upload_url: target.uploadUrl,
      key: target.key,
      method: 'PUT' as const,
      headers: { 'content-type': params.content_type },
      expires_in_seconds: target.expiresInSeconds,
      driver: target.driver,
    };
  }

  // ---------------------------------------------------------------- tool 4
  /**
   * Run a model. Image and audio complete inline; video returns `in_progress`
   * and the caller polls `list_tasks`. The split is declared per model via
   * `async`, not inferred from the modality, so a fast video model could run
   * inline without changing this code.
   */
  async runModel(params: {
    model: string;
    input: unknown;
    /** Who asked. Absent when the caller presented no credential. */
    createdBy?: TaskActor;
  }): Promise<{
    task_id: string;
    status: TaskStatus;
    result_url?: string;
    assets?: Asset[];
    cost: { usd: string; estimated: boolean; basis: string };
    eta_seconds?: number;
    error?: string;
  }> {
    const model = this.opts.registry.require(params.model);

    const enabled = await this.enabledIds();
    if (!enabled.has(model.id)) {
      throw new Error(`Model "${model.id}" is disabled in the control panel.`);
    }

    // Refuse before the round trip rather than after the provider rejects it.
    if (model.requiresByok) {
      throw new Error(
        `Model "${model.id}" is not available on Cloudflare's unified billing and needs your own provider key (BYOK). Forge does not carry per-provider keys yet — pick another model from search_models.`,
      );
    }

    // Validate before spending anything.
    const input = model.parse(params.input ?? {}) as Record<string, unknown>;
    const cost: CostEstimate = estimateCost(model, input);

    const task: Task = {
      id: `task_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`,
      model: model.id,
      modality: model.modality,
      status: model.async ? 'in_progress' : 'queued',
      label:
        typeof input.prompt === 'string'
          ? input.prompt.slice(0, 140)
          : typeof input.text === 'string'
            ? input.text.slice(0, 140)
            : model.name,
      input,
      costUsd: cost.usd,
      costEstimated: cost.estimated,
      createdAt: new Date().toISOString(),
      ...(params.createdBy ? { createdBy: params.createdBy } : {}),
      ...(params.createdBy?.organizationId
        ? { organizationId: params.createdBy.organizationId }
        : {}),
    };
    await this.opts.store.putTask(task);

    if (model.async) {
      const work = this.execute(model, input, task.id);
      (this.opts.waitUntil ?? ((p: Promise<unknown>) => void p.catch(() => undefined)))(work);
      return {
        task_id: task.id,
        status: 'in_progress',
        cost: { usd: cost.usd, estimated: cost.estimated, basis: cost.basis },
        eta_seconds: model.etaSeconds,
      };
    }

    const done = await this.execute(model, input, task.id);
    return {
      task_id: done.id,
      status: done.status,
      result_url: done.resultUrl,
      assets: done.assets,
      cost: { usd: done.costUsd, estimated: done.costEstimated, basis: cost.basis },
      error: done.error,
    };
  }

  /** Shared execution path for both inline and background runs. */
  /**
   * Fan out a settled task, without letting a listener break the run.
   *
   * Deliberately not awaited by `execute`: a slow endpoint should not hold a
   * task's own completion open, and on Workers `waitUntil` is what keeps the
   * isolate alive long enough to finish.
   */
  private announce(task: Task): Task {
    const hook = this.opts.onTaskSettled;
    if (!hook) return task;

    const work = Promise.resolve()
      .then(() => hook(task))
      .catch(() => undefined);
    (this.opts.waitUntil ?? ((p: Promise<unknown>) => void p.catch(() => undefined)))(work);
    return task;
  }

  private async execute(
    model: AnyModel,
    input: Record<string, unknown>,
    taskId: string,
  ): Promise<Task> {
    try {
      // Build the context INSIDE the try: a missing credential must land the task
      // in `failed`, not escape and strand it at `in_progress` forever.
      const ctx: RunContext = {
        ai: this.requireAi(),
        storeAsset: async (opts) => this.storeAsset(opts),
      };
      const output = await model.run(input, ctx);
      const first = output.assets[0];

      // A run that produced no asset has not succeeded, whatever the provider
      // said. Reporting `completed` with an empty result sends the caller off
      // to fetch nothing, and hides the real failure.
      if (!first) {
        const patched = await this.opts.store.patchTask(taskId, {
          status: 'failed',
          error:
            'Provider returned no media. The response did not contain a recognisable asset — see `raw` on this task for the payload.',
          raw: output.raw ?? null,
          completedAt: new Date().toISOString(),
        });
        return this.announce(patched ?? (await this.opts.store.getTask(taskId))!);
      }

      const patched = await this.opts.store.patchTask(taskId, {
        status: 'completed',
        assets: output.assets,
        resultUrl: first.url,
        raw: output.raw ?? null,
        completedAt: new Date().toISOString(),
      });
      return this.announce(patched ?? (await this.opts.store.getTask(taskId))!);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const patched = await this.opts.store.patchTask(taskId, {
        status: 'failed',
        error: message,
        completedAt: new Date().toISOString(),
      });
      return this.announce(patched ?? (await this.opts.store.getTask(taskId))!);
    }
  }

  private requireAi(): CloudflareAI {
    if (!this.opts.ai) {
      throw new Error(
        'Cloudflare credentials missing. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
      );
    }
    return this.opts.ai;
  }

  // ---------------------------------------------------------------- tool 5
  /**
   * `include_raw` is opt-in: provider payloads are verbose and an agent polling
   * a task list does not want them, but they are the only way to work out why a
   * run produced nothing.
   */
  async listTasks(params: {
    task_ids?: string[];
    status?: TaskStatus[];
    limit?: number;
    include_raw?: boolean;
    /** Inclusive ISO bounds. Either may be omitted; see TaskFilter. */
    start?: string;
    end?: string;
    /** Only runs started by this person. */
    user_id?: string;
    /** Only these model ids. Empty or absent means every model. */
    models?: string[];
    /**
     * Server-supplied, never a tool argument — a caller must not be able to
     * widen its own scope by passing someone else's organisation id.
     */
    organizationId?: string;
  }) {
    const tasks = await this.opts.store.listTasks({
      ids: params.task_ids,
      status: params.status,
      limit: params.limit ?? 50,
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.start ? { createdAfter: params.start } : {}),
      ...(params.end ? { createdBefore: params.end } : {}),
      ...(params.user_id ? { createdByUserId: params.user_id } : {}),
      ...(params.models?.length ? { models: params.models } : {}),
    });
    return {
      tasks: tasks.map((t) => ({
        task_id: t.id,
        model: t.model,
        modality: t.modality,
        status: t.status,
        label: t.label,
        result_url: t.resultUrl,
        assets: t.assets,
        cost: { usd: t.costUsd, estimated: t.costEstimated },
        created_by: t.createdBy,
        error: t.error,
        created_at: t.createdAt,
        completed_at: t.completedAt,
        ...(params.include_raw ? { raw: t.raw } : {}),
      })),
    };
  }

  /**
   * One task with everything on it, including the input and the raw provider
   * payload. Not an MCP tool: this is the control panel's detail view, where
   * verbosity is the point rather than a cost.
   */
  async getTask(id: string, organizationId?: string): Promise<Task | undefined> {
    const task = await this.opts.store.getTask(id);
    if (!task) return undefined;
    // A task id in a URL must not read across teams.
    if (organizationId && task.organizationId !== organizationId) return undefined;
    return task;
  }

  // ------------------------------------------------------------- dashboard
  async usage(windowDays = 30, organizationId?: string): Promise<UsageSummary> {
    const since = Date.now() - windowDays * 86_400_000;
    const tasks = (
      await this.opts.store.listTasks(organizationId ? { organizationId } : undefined)
    ).filter((t) => Date.parse(t.createdAt) >= since);
    const byModality: UsageSummary['byModality'] = {
      image: { usd: '0.000000', count: 0 },
      video: { usd: '0.000000', count: 0 },
      audio: { usd: '0.000000', count: 0 },
    };
    let total = '0.000000';
    for (const t of tasks) {
      if (t.status === 'failed') continue;
      total = addMoney(total, t.costUsd);
      const bucket = byModality[t.modality];
      bucket.usd = addMoney(bucket.usd, t.costUsd);
      bucket.count += 1;
    }
    return { totalUsd: total, taskCount: tasks.length, byModality, windowDays };
  }

  /**
   * Spend per day per modality, for the usage chart.
   *
   * Every day in the window is present, including the empty ones — a bar chart
   * that silently drops quiet days compresses time and misreads as steady use.
   */
  async usageSeries(
    windowDays: number,
    organizationId?: string,
  ): Promise<{
    days: Array<{ date: string; image: string; video: string; audio: string }>;
    windowDays: number;
  }> {
    const since = Date.now() - windowDays * 86_400_000;
    const tasks = (
      await this.opts.store.listTasks(organizationId ? { organizationId } : undefined)
    ).filter((t) => t.status !== 'failed' && Date.parse(t.createdAt) >= since);

    const byDay = new Map<string, { image: string; video: string; audio: string }>();
    for (let i = windowDays - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      byDay.set(date, { image: '0.000000', video: '0.000000', audio: '0.000000' });
    }

    for (const task of tasks) {
      const date = task.createdAt.slice(0, 10);
      const row = byDay.get(date);
      if (!row) continue;
      row[task.modality] = addMoney(row[task.modality], task.costUsd);
    }

    return {
      days: [...byDay.entries()].map(([date, row]) => ({ date, ...row })),
      windowDays,
    };
  }

  /** Spend and run count grouped by model, and separately by person. */
  async usageBreakdown(
    windowDays: number,
    organizationId?: string,
  ): Promise<{
    byModel: Array<{ model: string; modality: Modality; usd: string; count: number }>;
    byUser: Array<{
      userId: string;
      name: string;
      image?: string | null;
      usd: string;
      count: number;
    }>;
  }> {
    const since = Date.now() - windowDays * 86_400_000;
    const tasks = (
      await this.opts.store.listTasks(organizationId ? { organizationId } : undefined)
    ).filter((t) => t.status !== 'failed' && Date.parse(t.createdAt) >= since);

    const models = new Map<string, { modality: Modality; usd: string; count: number }>();
    const users = new Map<
      string,
      { name: string; image?: string | null; usd: string; count: number }
    >();

    for (const task of tasks) {
      const model = models.get(task.model) ?? {
        modality: task.modality,
        usd: '0.000000',
        count: 0,
      };
      models.set(task.model, {
        modality: task.modality,
        usd: addMoney(model.usd, task.costUsd),
        count: model.count + 1,
      });

      // Runs with no credential are grouped rather than dropped: the spend is
      // real even when the name is missing.
      const id = task.createdBy?.userId ?? 'unattributed';
      const user = users.get(id) ?? {
        name: task.createdBy?.name ?? 'Unattributed',
        image: task.createdBy?.image ?? null,
        usd: '0.000000',
        count: 0,
      };
      users.set(id, {
        ...user,
        usd: addMoney(user.usd, task.costUsd),
        count: user.count + 1,
      });
    }

    const bySpend = <T extends { usd: string }>(a: T, b: T) => Number(b.usd) - Number(a.usd);

    return {
      byModel: [...models.entries()]
        .map(([model, row]) => ({ model, ...row }))
        .sort(bySpend),
      byUser: [...users.entries()].map(([userId, row]) => ({ userId, ...row })).sort(bySpend),
    };
  }

  async listAllModels(): Promise<ModelSummary[]> {
    return Promise.all(this.opts.registry.list().map((m) => this.summarise(m)));
  }

  async setModelEnabled(id: string, enabled: boolean): Promise<void> {
    this.opts.registry.require(id);
    await this.opts.store.setModelEnabled(id, enabled);
  }
}

/** Zod schemas for the five tools, shared by the MCP endpoint and the REST routes. */
export const toolSchemas = {
  search_models: z.object({
    type: z.enum(['image', 'video', 'audio']).optional(),
    query: z.string().optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe('Default 10. Raise it to browse the catalog; the cap is 200.'),
  }),
  get_model_schemas: z.object({ model: z.string() }),
  get_upload_url: z.object({
    content_type: z.string(),
    extension: z.string().optional(),
  }),
  run_models: z.object({
    model: z.string(),
    input: z.record(z.string(), z.unknown()).default({}),
  }),
  list_tasks: z.object({
    task_ids: z.array(z.string()).optional(),
    status: z.array(z.enum(['queued', 'in_progress', 'completed', 'failed'])).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    include_raw: z
      .boolean()
      .optional()
      .describe('Include the untouched provider payload. Verbose; use when debugging a result.'),
    start: z
      .string()
      .optional()
      .describe(
        'Inclusive ISO-8601 lower bound on when the run started. Omit to reach back to the first run.',
      ),
    end: z
      .string()
      .optional()
      .describe(
        'Inclusive ISO-8601 upper bound. Omit for a live range that keeps including new runs.',
      ),
    user_id: z.string().optional().describe('Only runs started by this user.'),
    models: z
      .array(z.string())
      .optional()
      .describe('Only runs of these model ids. Omit for every model.'),
  }),
};
