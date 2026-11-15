import { createMCPClient } from '@ai-sdk/mcp';
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from 'ai';
import { headers } from 'next/headers';
import { createWorkersAI } from 'workers-ai-provider';
import { resolveActor } from '@/lib/actor';
import { ensureChat, saveMessages } from '@/lib/chats';
import { baseUrl } from '@/lib/forge';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * The model that drives the chat.
 *
 * Workers AI, because those credentials are already configured — adding an
 * OpenAI or Anthropic key just to host the conversation would be a second
 * vendor relationship for the part of the system doing the least work.
 *
 * Not llama-3.3-70b, which was the obvious pick and does advertise function
 * calling: asked to "say hello in five words" it called run_models with
 * `{"model": "audio"}`, and streamed every argument delta twice. gpt-oss-120b
 * handles the same prompts without reaching for a tool.
 */
const CHAT_MODEL = '@cf/openai/gpt-oss-120b';

const SYSTEM = `You are Sequel, a media generation assistant.

You can generate images, video and audio by calling the tools available to
you. Follow this order:

1. search_models to find a model that fits what the person asked for. Prefer a
   cheap, fast model unless they ask for quality.
2. get_model_schemas if you are unsure of a model's exact parameter names.
3. run_models to generate. Pass the person's intent as the prompt, improved
   where it is vague, but never contradicting what they asked for.

If the person attached files, their URLs are listed at the end of their
message. Pass the URL straight through as file_url when a model takes an
input image, video or audio. You cannot see an attachment yourself — do not
describe its contents, ask if you need to know what is in it.

Rules:
- Never invent a model id. Only use ids returned by search_models.
- Video is asynchronous: run_models returns in_progress with a task_id. Say so
  and tell them it will appear in Tasks.
- State the cost after a run. It is an estimate; say that it is.
- Do not describe the image you generated as though you can see it. You cannot.
- Be brief. One or two sentences around a tool call, not a paragraph.`;

export async function POST(request: Request) {
  const actor = await resolveActor(request);
  if (!actor?.organizationId) {
    return Response.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { messages, chatId } = (await request.json()) as {
    messages: UIMessage[];
    chatId?: string;
  };

  if (!chatId) return Response.json({ error: 'chatId is required' }, { status: 400 });

  const chat = await ensureChat({
    chatId,
    organizationId: actor.organizationId,
    userId: actor.userId,
    messages,
  });
  if (!chat) return Response.json({ error: 'Not found' }, { status: 404 });

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiKey) {
    return Response.json(
      { error: 'Chat needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.' },
      { status: 503 },
    );
  }

  /*
   * The model reaches our own MCP endpoint rather than calling Forge directly.
   *
   * It is a round trip to ourselves, which is not free — but it means the
   * chat uses exactly the tool surface an outside agent uses, including its
   * scoping and its attribution. A second, privileged path into the same
   * functions is how the two drift apart.
   *
   * The session cookie goes with it, so runs are filed under this person and
   * this organisation like any other.
   */
  const cookie = (await headers()).get('cookie') ?? '';
  const mcp = await createMCPClient({
    transport: {
      type: 'http',
      url: `${baseUrl()}/api/mcp`,
      headers: { cookie },
    },
  });

  const workersai = createWorkersAI({ accountId, apiKey });

  /*
   * Time each tool around its own execute, rather than inferring it from step
   * boundaries. A step is model time plus tool time; only the wrapper can
   * tell them apart, and 'worked for 12s' is worth nothing if the 12s is
   * mostly the model thinking about what to call next.
   *
   * Keyed by toolCallId because the same tool is called more than once in a
   * run — two search_models calls are two rows in the trace, not one.
   */
  const startedAt = Date.now();
  const toolMs: Record<string, number> = {};
  const rawTools = await mcp.tools();
  const tools = Object.fromEntries(
    Object.entries(rawTools).map(([name, tool]) => [
      name,
      {
        ...tool,
        execute: async (args: unknown, options: { toolCallId: string }) => {
          const began = Date.now();
          try {
            return await tool.execute?.(args as never, options as never);
          } finally {
            toolMs[options.toolCallId] = Date.now() - began;
          }
        },
      },
    ]),
  ) as typeof rawTools;

  /*
   * File parts are for the browser, not the model.
   *
   * gpt-oss-120b is text-only: handed an image content part it returns an
   * empty message and the whole turn is lost silently. What it needs is the
   * URL, which submit() already spells out in the message text, and which is
   * what it passes to run_models anyway. Keep the parts on the message we
   * persist so the attachment still renders; drop them on the way in.
   *
   * Revisit when the chat model is one that can actually see.
   */
  const forModel = messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part) => part.type !== 'file'),
  }));

  const result = streamText({
    model: workersai(CHAT_MODEL),
    system: SYSTEM,
    messages: await convertToModelMessages(forModel),
    tools,
    // Search, then maybe a schema, then run, then summarise. Four is the
    // shortest path that completes; eight leaves room for one retry.
    stopWhen: stepCountIs(8),
    onFinish: async () => {
      await mcp.close();
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    /*
     * Attached at 'finish', when every duration is known. The browser times
     * the same work live off part state transitions; this is the copy that
     * survives a reload.
     */
    messageMetadata: ({ part }) =>
      part.type === 'finish' ? { totalMs: Date.now() - startedAt, toolMs } : undefined,
    // Written once the stream ends, with the assistant's parts complete —
    // tool calls, their results and all. Persisting mid-stream would store
    // half a tool call.
    onFinish: async ({ messages: finished }) => {
      await saveMessages(chatId, finished);
    },
  });
}
