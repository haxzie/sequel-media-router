import type { ModelSummary, Sequel, Toolset, ToolsetContext } from '@sequelsh/core';
import { jsonSchema, tool, type Tool } from 'ai';
import { z } from 'zod';

/**
 * Sequel as Vercel AI SDK tools.
 *
 * Two shapes, because both are right somewhere:
 *
 * - discovery (default) gives the model three tools and lets it look things
 *   up. Prompt cost is constant whatever the catalogue holds.
 * - per-model gives one tool per filtered model, with that model's own
 *   parameters typed from its schema. No discovery round trip, but the
 *   prompt grows with the list — fine for three, not for twenty.
 */
export class AISDKToolset implements Toolset<Tool> {
  build(context: ToolsetContext): Record<string, Tool> {
    return context.mode === 'discovery'
      ? discoveryTools(context.client)
      : perModelTools(context);
  }
}

function discoveryTools(client: Sequel): Record<string, Tool> {
  return {
    search_models: tool({
      description:
        'Find media generation models by use case. Returns id, capabilities, price and latency. Omit the query to browse.',
      inputSchema: z.object({
        query: z.string().optional().describe('What you want to make.'),
        type: z.enum(['image', 'video', 'audio']).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
      execute: async (args) => client.search(args),
    }),

    get_model_schemas: tool({
      description:
        'The exact input parameters a model takes. Call this before run_models when unsure of a field name.',
      inputSchema: z.object({ model: z.string() }),
      execute: async ({ model }) => client.schema(model),
    }),

    run_models: tool({
      description:
        'Generate with a model. Image and audio return finished; video returns in_progress with a task id.',
      inputSchema: z.object({
        model: z.string().describe('An id returned by search_models. Never invent one.'),
        params: z
          .record(z.string(), z.unknown())
          .describe("The model's own input object — prompt for most, text for speech."),
      }),
      execute: async ({ model, params }) => {
        const handle = await client.run({ model, params });
        return handle.task;
      },
    }),
  };
}

/** `openai/gpt-image-2.5-flare` is not a legal tool name. */
function toolName(model: ModelSummary): string {
  return `generate_${model.id.replace(/^@/, '').replace(/[^a-zA-Z0-9]+/g, '_')}`.slice(0, 63);
}

function perModelTools(context: ToolsetContext): Record<string, Tool> {
  const tools: Record<string, Tool> = {};

  for (const model of context.models) {
    const schema = context.schemas[model.id];
    if (!schema) continue;

    tools[toolName(model)] = tool({
      description: `${model.name} (${model.modality}). ${model.description}`.slice(0, 1020),
      /*
       * The model's published JSON Schema, handed to the SDK as-is rather
       * than rebuilt in zod. It is already the authority on what this model
       * accepts, and a second description of it could only ever be wrong.
       */
      inputSchema: jsonSchema(schema.inputSchema as never),
      execute: async (params) => {
        const handle = await context.client.run({
          model: model.id,
          params: params as Record<string, unknown>,
        });
        return handle.task;
      },
    });
  }

  return tools;
}
