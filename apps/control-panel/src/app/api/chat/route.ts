import { createMCPClient } from '@ai-sdk/mcp';
import { convertToModelMessages, generateText, streamText, stepCountIs, type UIMessage } from 'ai';
import { headers } from 'next/headers';
import { createWorkersAI } from 'workers-ai-provider';
import { resolveActor } from '@/lib/actor';
import { derivedTitle, ensureChat, renameChat, saveMessages } from '@/lib/chats';
import { baseUrl } from '@/lib/forge';
import { POST as mcpEndpoint } from '@/app/mcp/route';

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

const SYSTEM = `You are Sequel, a media generation assistant. You are in the
chat on Sequel's Create page: a web app someone is looking at, not a terminal
and not an API client.

WHAT THEY CAN ALREADY SEE

Your output is rendered, not printed. Before writing a word, assume this is
on screen already:

- Every image and video you generate, inline and full size, as it arrives.
- A click on one opens it large, beside its prompt, model, cost, and a
  download button.
- Your tool calls, above your reply, as a trace they can expand, with timings.

So do not paste result URLs. Do not number what you made ("1. Mug, 2.
Sunglasses"). Do not explain how to view, open, save or download anything. Do
not announce a tool before calling it. Every one of those repeats something
already in front of them, and a list of URLs under a grid of pictures is pure
noise.

HOW TO WORK

1. search_models to find a model that fits. Prefer cheap and fast unless they
   ask for quality.
2. get_model_schemas when you need a model's exact parameter names.
3. run_models to generate. Pass their intent as the prompt, sharpened where
   it is vague, never contradicting what they asked for.

Never invent a model id. Only ids returned by search_models exist.

WRITING THE PROMPT

What someone types is a request, not a prompt. Turn it into one, keeping
their intent exactly and inventing nothing they did not ask for.

Everything:
- Prose, not comma-separated tags. These encoders are trained on sentences.
- Concrete over decorative. "Chipped enamel mug, morning light from the left"
  beats "beautiful mug, 8K, masterpiece". Quality tokens do nothing at all.
- Lens, lighting and framing steer realism further than any adjective.
- Say what should be there, never what should not. "An empty beach at dawn"
  works; "no people" tends to summon people.

Images:
- Order: scene, then subject, then detail, then constraints. Name the use
  where there is one — product shot, app icon, poster — it sets the polish.
- flux-1-schnell: 30 to 60 words. It is a distilled model, so extra length
  and negative phrasing are both wasted on it.
- gpt-image-2.5-flare: takes longer, structured prompts, and short labelled
  lines beat one long paragraph. Put literal text to render in quotes. When
  editing, write "change only X, keep everything else the same" and repeat
  what to preserve every single time or it drifts.

Video:
- One camera move, one action, one mood. Ask for more inside five seconds and
  it delivers none of them.
- Subject first in the sentence, or it drifts into a generic one.
- veo-3.1 generates its own audio: describe the ambience, and put any spoken
  line in quotation marks.

Speech:
- The input is a script, read aloud verbatim. Never describe the voice in it
  — "say this warmly" gets spoken.
- Punctuation is the only pacing control there is. Under-punctuated text
  comes out rushed.
- Spell out whatever gets mispronounced: dates, money, and uncommon acronyms
  as N-A-S-A. No markdown, emoji or braces; they are read out loud.

Music: genre, instrumentation, tempo, mood, and structure.

SEVERAL AT ONCE

Several variations, several subjects, several sizes: one run_models call, not
one per image. They run in parallel and land together as a grid.

Use "prompts" for this almost always — one "model", one "input" for the
shared settings, and a "prompts" array of what differs. It is a fraction of
the JSON of a "runs" array, and a long "runs" array gets truncated mid-string
and fails. Reach for "runs" only when the batch genuinely needs different
models. Keep each prompt short.

ATTACHED FILES

When someone attaches a file its URL is listed at the end of their message.
To use one as a reference or to edit it:

- Call get_model_schemas first and use the field that schema names. It
  differs by model (images, image_url, first_frame_image). There is no
  universal file_url.
- Pass the URL as-is. It is fetched and converted for you, whatever the
  provider wants.
- Pick a model whose capabilities include image-editing or image-to-image. A
  text-to-image model ignores a reference silently.

You cannot see an attachment. Do not describe or guess at its contents, and
do not refuse to use it on that basis — the model you call can see it even
though you cannot. Ask only when the request makes no sense without knowing.

VOICE

- A sentence, occasionally two. The media is the answer; your words are a
  caption on it.
- When the picture says everything, say nothing beyond a brief acknowledgement.
- You cannot see what you generated. Never describe its contents or praise it.
- Costs are on screen. Mention one only when asked, and say it is an estimate.
- Video is the exception to all of this: it is asynchronous, so there is
  nothing to look at yet. Say it is running and will appear under Tasks.`;

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

  /*
   * Persist what they said before generating a reply to it.
   *
   * Waiting for onFinish meant a turn that never finished — a reload, a
   * navigation, a dropped connection, a server restart — took the person's
   * own message down with it. The chat row and its title were written here
   * and the messages were not, so the link resolved to a titled, empty chat
   * and looked broken.
   *
   * saveMessages replaces the whole conversation, so running it twice a turn
   * is idempotent; the onFinish call supersedes this one with the reply
   * attached.
   */
  await saveMessages(chatId, messages);

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiKey) {
    return Response.json(
      { error: 'Chat needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.' },
      { status: 503 },
    );
  }

  /*
   * The model goes through our own MCP endpoint rather than calling Forge
   * directly, so the chat uses exactly the tool surface an outside agent
   * uses — same scoping, same attribution. A second, privileged path into
   * the same functions is how the two drift apart.
   *
   * What it does not do any more is go out to the network to get there. On
   * Cloudflare that request leaves the isolate, comes back through the edge
   * to the same Worker, and in production it never arrived: the MCP client
   * treated the failure as 'unauthenticated', started the OAuth dance, and
   * died on `redirect: 'error'`, which Workers' fetch does not implement.
   * The chat broke with a TypeError about redirect values and no mention of
   * any of this.
   *
   * So the transport's fetch calls the route handler in the same isolate
   * instead. It is still an HTTP request object carrying the session cookie,
   * still answered by the handler every external client talks to — it just
   * does not go anywhere. No loopback, no OAuth, no round trip to pay for.
   */
  const cookie = (await headers()).get('cookie') ?? '';
  const mcp = await createMCPClient({
    transport: {
      type: 'http',
      url: `${baseUrl()}/mcp`,
      headers: { cookie },
      fetch: async (input, init) =>
        mcpEndpoint(
          new Request(typeof input === 'string' ? input : input.toString(), {
            ...init,
            // Workers' fetch rejects 'error'; nothing here redirects anyway.
            redirect: 'follow',
          }),
        ),
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

  /*
   * A new chat is titled with the prompt itself, truncated, because that is
   * all there is when the row is written. Once the turn has finished there
   * is something to summarise, so the first turn — and only the first —
   * earns a real name.
   */
  const firstTurn = messages.filter((message) => message.role === 'user').length === 1;

  async function retitle(finished: UIMessage[]) {
    /* Captured rather than read through `actor?.` at the call: the narrowing
       does not survive the awaits in between. */
    const organizationId = actor?.organizationId;
    const id = chatId;
    if (!firstTurn || !organizationId || !id) return;

    const asked = finished.find((message) => message.role === 'user');
    const text = asked?.parts
      .filter((part) => part.type === 'text')
      .map((part) => (part as { text: string }).text)
      .join(' ')
      .slice(0, 500);
    if (!text) return;

    try {
      const { text: title } = await generateText({
        model: workersai(CHAT_MODEL),
        // Three to six words, and the reasoning that precedes them.
        maxOutputTokens: 256,
        prompt:
          'Write a title of three to six words for a chat that began with the request below. ' +
          'Name the thing being made, not the act of making it. No quotes, no trailing period, ' +
          'no words like "request" or "chat".\n\n' +
          text,
      });

      await renameChat({
        chatId: id,
        organizationId,
        title: (title.split('\n')[0] ?? '').trim(),
        // Only if nobody has touched it since; see renameChat.
        ifStillTitled: derivedTitle(messages),
      });
    } catch {
      // A chat keeps its truncated prompt as a name. Never worth failing a
      // turn that already produced what the person asked for.
    }
  }

  const result = streamText({
    model: workersai(CHAT_MODEL),
    system: SYSTEM,
    messages: await convertToModelMessages(forModel),
    tools,
    /*
     * Stated, because Workers AI's default is small and the thing that
     * overruns it is a tool call rather than a sentence.
     *
     * An image prompt written properly is a few hundred tokens of JSON
     * arguments, and the cap does not stop at a message boundary: it cut one
     * mid-string, so the chat reported `AI_JSONParseError: Unterminated
     * string in JSON at position 103` and the person saw a failed step for
     * what was a perfectly good prompt.
     */
    maxOutputTokens: 2048,
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
      await retitle(finished);
    },
  });
}
