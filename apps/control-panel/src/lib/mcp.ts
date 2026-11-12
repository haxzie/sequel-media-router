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
import { toolSchemas, type Forge } from '@forge/core';
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
    'Find media generation models by use case or name. Returns each model with its capabilities, price, latency and a one-line outline. Filter by type: image, video or audio.',
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

async function callTool(forge: Forge, name: string, rawArgs: unknown) {
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
    const args = parsed.data as never;
    switch (name as ToolName) {
      case 'search_models':
        return toolResult(await forge.searchModels(args));
      case 'get_model_schemas':
        return toolResult(await forge.getModelSchemas(args));
      case 'get_upload_url':
        return toolResult(await forge.getUploadUrl(args));
      case 'run_models':
        return toolResult(await forge.runModel(args));
      case 'list_tasks':
        return toolResult(await forge.listTasks(args));
    }
  } catch (error) {
    return toolResult({ error: error instanceof Error ? error.message : String(error) }, true);
  }
}

/** Handle one JSON-RPC message. Returns null for notifications, which get a 202. */
export async function handleMcpMessage(
  forge: Forge,
  message: JsonRpcRequest,
): Promise<object | null> {
  const { id, method, params } = message;

  switch (method) {
    case 'initialize':
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'composio-forge', version: '0.1.0' },
        instructions:
          'Forge exposes image, video and audio generation models behind one interface. Start with search_models to find a model by use case, then get_model_schemas for its parameters, then run_models. Video runs are asynchronous — poll list_tasks.',
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
      return result(id, await callTool(forge, name, args));
    }

    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}
