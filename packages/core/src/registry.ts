/**
 * The model registry.
 *
 * Models are registered once at server start from `@sequel/models`. Everything
 * that needs to know what exists — the MCP tools, the control panel, the
 * embedding index — reads this.
 */
import type { AnyModel } from './define';
import type { Modality } from './types';

export class ModelRegistry {
  private readonly models = new Map<string, AnyModel>();
  /** alias → canonical id. Separate so `list()` still yields each model once. */
  private readonly aliases = new Map<string, string>();

  register(...models: AnyModel[]): this {
    for (const model of models) {
      if (this.models.has(model.id)) {
        throw new Error(`Duplicate model id: ${model.id}`);
      }
      const taken = this.aliases.get(model.alias);
      if (taken && taken !== model.id) {
        throw new Error(`Duplicate model alias: ${model.alias} (${taken} and ${model.id})`);
      }
      this.models.set(model.id, model);
      this.aliases.set(model.alias, model.id);
    }
    return this;
  }

  /**
   * Resolves either name. Published ids are aliases, but tasks stored before
   * a model was aliased — and anything a caller copied from Cloudflare's own
   * docs — carry the canonical id, and both have to keep working.
   */
  get(id: string): AnyModel | undefined {
    return this.models.get(id) ?? this.models.get(this.aliases.get(id) ?? '');
  }

  /** Throws rather than returning undefined — tool handlers want the message. */
  require(id: string): AnyModel {
    const model = this.get(id);
    if (!model) {
      throw new Error(
        `Unknown model "${id}". Call search_models to discover available model ids.`,
      );
    }
    return model;
  }

  list(filter?: { modality?: Modality; ids?: string[] }): AnyModel[] {
    let items = [...this.models.values()];
    if (filter?.modality) items = items.filter((m) => m.modality === filter.modality);
    if (filter?.ids) {
      const wanted = new Set(filter.ids);
      items = items.filter((m) => wanted.has(m.id) || wanted.has(m.alias));
    }
    return items;
  }

  get size(): number {
    return this.models.size;
  }
}

export function createRegistry(models: AnyModel[] = []): ModelRegistry {
  return new ModelRegistry().register(...models);
}
