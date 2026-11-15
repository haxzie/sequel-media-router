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

  const result = streamText({
    model: workersai(CHAT_MODEL),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: await mcp.tools(),
    // Search, then maybe a schema, then run, then summarise. Four is the
    // shortest path that completes; eight leaves room for one retry.
    stopWhen: stepCountIs(8),
    onFinish: async () => {
      await mcp.close();
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    // Written once the stream ends, with the assistant's parts complete —
    // tool calls, their results and all. Persisting mid-stream would store
    // half a tool call.
    onFinish: async ({ messages: finished }) => {
      await saveMessages(chatId, finished);
    },
  });
}
