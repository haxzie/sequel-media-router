/**
 * Persistence.
 *
 * One interface, two drivers. The file driver is what makes `pnpm dev` work on a
 * fresh clone with no Cloudflare account; the memory driver is for tests and for
 * the Workers runtime, where the filesystem is not writable.
 *
 * D1 is the intended production driver and slots in here without touching any
 * caller — see README for the migration.
 */
import type { EmbeddingCache, EmbeddingRecord } from './embeddings';
import type { AssetAlias, ModelState, Task, TaskStatus } from './types';

export interface TaskFilter {
  ids?: string[];
  status?: TaskStatus[];
  limit?: number;
  /**
   * Scope to one organisation. Omitted means unscoped, which only the
   * dashboard's own maintenance paths should ever want.
   */
  organizationId?: string;
  /**
   * Inclusive ISO bounds on `createdAt`. Either end may be omitted, and each
   * omission means exactly what it says: no `createdBefore` is a live range
   * that keeps including new runs, no `createdAfter` reaches back to the
   * first one.
   */
  createdAfter?: string;
  createdBefore?: string;
}

export interface Store extends EmbeddingCache {
  listTasks(filter?: TaskFilter): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  putTask(task: Task): Promise<void>;
  patchTask(id: string, patch: Partial<Task>): Promise<Task | undefined>;

  getModelStates(): Promise<ModelState[]>;
  setModelEnabled(id: string, enabled: boolean): Promise<void>;

  putAlias(alias: AssetAlias): Promise<void>;
  getAlias(id: string): Promise<AssetAlias | undefined>;
}

interface Snapshot {
  tasks: Task[];
  modelStates: ModelState[];
  embeddings: EmbeddingRecord[];
  aliases: AssetAlias[];
}

const empty = (): Snapshot => ({ tasks: [], modelStates: [], embeddings: [], aliases: [] });

/** Shared behaviour; subclasses only supply load/save. */
abstract class BaseStore implements Store {
  protected abstract load(): Promise<Snapshot>;
  protected abstract save(snapshot: Snapshot): Promise<void>;

  /** Serialises read-modify-write so concurrent requests cannot clobber each other. */
  private queue: Promise<unknown> = Promise.resolve();
  protected mutate<T>(fn: (snapshot: Snapshot) => Promise<T> | T): Promise<T> {
    const next = this.queue.then(async () => {
      const snapshot = await this.load();
      const result = await fn(snapshot);
      await this.save(snapshot);
      return result;
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  async listTasks(filter?: TaskFilter): Promise<Task[]> {
    const { tasks } = await this.load();
    let out = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter?.organizationId) {
      // Strict equality, so an unassigned task is not visible to any team.
      out = out.filter((t) => t.organizationId === filter.organizationId);
    }
    // ISO-8601 sorts lexicographically, so no date parsing is needed here.
    if (filter?.createdAfter) out = out.filter((t) => t.createdAt >= filter.createdAfter!);
    if (filter?.createdBefore) out = out.filter((t) => t.createdAt <= filter.createdBefore!);
    if (filter?.ids?.length) {
      const want = new Set(filter.ids);
      out = out.filter((t) => want.has(t.id));
    }
    if (filter?.status?.length) {
      const want = new Set(filter.status);
      out = out.filter((t) => want.has(t.status));
    }
    return filter?.limit ? out.slice(0, filter.limit) : out;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const { tasks } = await this.load();
    return tasks.find((t) => t.id === id);
  }

  async putTask(task: Task): Promise<void> {
    await this.mutate((s) => {
      const at = s.tasks.findIndex((t) => t.id === task.id);
      if (at >= 0) s.tasks[at] = task;
      else s.tasks.unshift(task);
    });
  }

  async patchTask(id: string, patch: Partial<Task>): Promise<Task | undefined> {
    return this.mutate((s) => {
      const at = s.tasks.findIndex((t) => t.id === id);
      if (at < 0) return undefined;
      const next = { ...s.tasks[at]!, ...patch } as Task;
      s.tasks[at] = next;
      return next;
    });
  }

  async getModelStates(): Promise<ModelState[]> {
    const { modelStates } = await this.load();
    return modelStates;
  }

  async setModelEnabled(id: string, enabled: boolean): Promise<void> {
    await this.mutate((s) => {
      const at = s.modelStates.findIndex((m) => m.id === id);
      if (at >= 0) s.modelStates[at] = { id, enabled };
      else s.modelStates.push({ id, enabled });
    });
  }

  async putAlias(alias: AssetAlias): Promise<void> {
    await this.mutate((s) => {
      const at = s.aliases.findIndex((a) => a.id === alias.id);
      if (at >= 0) s.aliases[at] = alias;
      else s.aliases.push(alias);
    });
  }

  async getAlias(id: string): Promise<AssetAlias | undefined> {
    const { aliases } = await this.load();
    return aliases.find((a) => a.id === id);
  }

  async read(): Promise<EmbeddingRecord[]> {
    const { embeddings } = await this.load();
    return embeddings;
  }

  async write(records: EmbeddingRecord[]): Promise<void> {
    await this.mutate((s) => {
      s.embeddings = records;
    });
  }
}

export class MemoryStore extends BaseStore {
  private snapshot = empty();
  protected async load(): Promise<Snapshot> {
    return this.snapshot;
  }
  protected async save(snapshot: Snapshot): Promise<void> {
    this.snapshot = snapshot;
  }
}

/**
 * JSON-file driver. Deliberately dumb — this is a POC store, not a database.
 * Writes the whole snapshot each time, which is fine at POC volumes and makes
 * the file trivially inspectable while debugging.
 */
export class FileStore extends BaseStore {
  private cached: Snapshot | null = null;

  constructor(private readonly path: string) {
    super();
  }

  protected async load(): Promise<Snapshot> {
    if (this.cached) return this.cached;
    const { readFile } = await import('node:fs/promises');
    try {
      const raw = await readFile(this.path, 'utf8');
      this.cached = { ...empty(), ...(JSON.parse(raw) as Partial<Snapshot>) };
    } catch {
      this.cached = empty();
    }
    return this.cached;
  }

  protected async save(snapshot: Snapshot): Promise<void> {
    this.cached = snapshot;
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(snapshot, null, 2), 'utf8');
  }
}
