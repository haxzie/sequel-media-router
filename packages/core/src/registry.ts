/**
 * The model registry.
 *
 * Models are registered once at server start from `@forge/models`. Everything
 * that needs to know what exists — the MCP tools, the control panel, the
 * embedding index — reads this.
 */
import type { AnyModel } from './define';
import type { Modality } from './types';

export class ModelRegistry {
  private readonly models = new Map<string, AnyModel>();

  register(...models: AnyModel[]): this {
    for (const model of models) {
      if (this.models.has(model.id)) {
        throw new Error(`Duplicate model id: ${model.id}`);
      }
      this.models.set(model.id, model);
    }
    return this;
  }

  get(id: string): AnyModel | undefined {
    return this.models.get(id);
  }

  /** Throws rather than returning undefined — tool handlers want the message. */
  require(id: string): AnyModel {
    const model = this.models.get(id);
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
      items = items.filter((m) => wanted.has(m.id));
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
