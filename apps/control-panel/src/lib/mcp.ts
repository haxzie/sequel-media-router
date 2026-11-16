/**
 * A minimal, stateless MCP server over Streamable HTTP.
 *
 * Hand-rolled rather than pulled from a framework: the tools-only subset of MCP
 * is a small JSON-RPC surface, and owning it means no transport dependency to
 * keep in step with Next, and no Redis requirement for session state.
 *
 * Implements: initialize, notifications/initialized, tools/list, tools/call,
 * ping. Anything else gets a proper JSON-RPC "method not found".
 */
import { toolSchemas, type Forge, type TaskActor } from '@sequel/core';
import { z } from 'zod/v4';

const PROTOCOL_VERSION = '2025-06-18';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

type ToolName = keyof typeof toolSchemas;

const TOOL_DESCRIPTIONS: Record<ToolName, string> = {
  search_models:
    'Find media generation models by use case or name, or browse the whole catalog by omitting the query. Returns each model with its capabilities, price, latency and a one-line outline. Filter by type (image, video, audio); raise limit (default 10, max 200) to list everything.',
  get_model_schemas:
    'Return the full JSON Schema for a model’s input, plus its capabilities and published rates. Call this before run_models when you need the exact parameter names.',
  get_upload_url:
    'Get a URL to PUT a file to, and the URL the file will be readable from afterwards. Use the returned file_url as an input to run_models.',
  run_models:
    'Run a model. Image and audio return a result inline; video returns status in_progress with a task_id to poll via list_tasks. Always reports estimated cost.',
  list_tasks:
    'List recent generation tasks with their status, result URLs and cost. Filter by task_ids or status.',
};

function result(id: JsonRpcRequest['id'], value: unknown) {
  return { jsonrpc: '2.0' as const, id, result: value };
}

function failure(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0' as const, id, error: { code, message, ...(data ? { data } : {}) } };
}

/** MCP wants tool results as content blocks; JSON goes in a text block. */
function toolResult(payload: unknown, isError = false) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    isError,
  };
}

function toolList() {
  return (Object.keys(toolSchemas) as ToolName[]).map((name) => ({
    name,
    description: TOOL_DESCRIPTIONS[name],
    inputSchema: z.toJSONSchema(toolSchemas[name], { io: 'input', unrepresentable: 'any' }),
  }));
}

async function callTool(
  forge: Forge,
  name: string,
  rawArgs: unknown,
  actor: TaskActor | null,
) {
  if (!(name in toolSchemas)) {
    return toolResult({ error: `Unknown tool "${name}"` }, true);
  }
  const schema: z.ZodType = toolSchemas[name as ToolName];
  const parsed = schema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    // Flatten to path + message: an agent can act on that, a nested tree it cannot.
    return toolResult(
      {
        error: 'Invalid arguments',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      },
      true,
    );
  }

  try {
    /*
     * action_info is for the person watching, not for the tool. Drop it here
     * so no handler has to know about it and nothing can be keyed off it by
     * accident.
     */
    const { action_info: _displayOnly, ...rest } = parsed.data as Record<string, unknown>;
    const args = rest as never;
    switch (name as ToolName) {
      case 'search_models':
        return toolResult(await forge.searchModels(args));
      case 'get_model_schemas':
        return toolResult(await forge.getModelSchemas(args));
      case 'get_upload_url':
        return toolResult(await forge.getUploadUrl(args));
      case 'run_models': {
        // The run records who asked, when the caller presented a credential.
        // `args` is `never` for the shared dispatch, so the shape is restated
        // here rather than spread.
        const run = rest as { model: string; input: unknown };
        return toolResult(
          await forge.runModel({
            model: run.model,
            input: run.input,
            ...(actor ? { createdBy: actor } : {}),
          }),
        );
      }
      case 'list_tasks': {
        /*
         * Scope comes from the credential, not the arguments. An agent cannot
         * widen it, and an unauthenticated caller sees nothing rather than
         * every team's runs.
         */
        // No organisation means no scope to apply, and an unscoped list would
        // be every team's runs. Empty is the correct answer, not everything.
        if (!actor?.organizationId) return toolResult({ tasks: [] });

        const filters = rest as Record<string, unknown>;
        return toolResult(
          await forge.listTasks({ ...filters, organizationId: actor.organizationId }),
        );
      }
    }
  } catch (error) {
    return toolResult({ error: error instanceof Error ? error.message : String(error) }, true);
  }
}

/** Handle one JSON-RPC message. Returns null for notifications, which get a 202. */
export async function handleMcpMessage(
  forge: Forge,
  message: JsonRpcRequest,
  /** Who the transport authenticated, if anyone. Recorded on any run. */
  actor: TaskActor | null = null,
): Promise<object | null> {
  const { id, method, params } = message;

  switch (method) {
    case 'initialize':
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'composio-sequel', version: '0.1.0' },
        instructions:
          'Sequel exposes image, video and audio generation models behind one interface. Start with search_models to find a model by use case, then get_model_schemas for its parameters, then run_models. Video runs are asynchronous — poll list_tasks.',
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'ping':
      return result(id, {});

    case 'tools/list':
      return result(id, { tools: toolList() });

    case 'tools/call': {
      const { name, arguments: args } = (params ?? {}) as { name?: string; arguments?: unknown };
      if (!name) return failure(id, -32602, 'tools/call requires a tool name');
      await forge.ready();
      return result(id, await callTool(forge, name, args, actor));
    }

    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}
