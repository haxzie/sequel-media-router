import { InstallButton } from '@/components/landing/install-button';
import { Code, SystemPrompt } from '../parts';
import { BUILD_PROMPT, GENERATE_PROMPT } from './system-prompts';

/**
 * The two ways in, each on its own page.
 *
 * These were one page, and the join showed: a creator scrolled past `npm i`
 * to reach the prompt meant for them, and a developer read an MCP install
 * they were never going to run. Splitting them means each page can end where
 * its reader is done rather than where the other reader starts.
 */

export function ForCreators({ mcpUrl }: { mcpUrl: string }) {
  return (
    <>
      <h1>For creators</h1>
      <p className="lead">
        Give the agent you already use the ability to make images, video and audio. Nothing to
        integrate, no key to paste — one command and it can generate.
      </p>

      <h2 id="connect">Connect it</h2>
      <p>
        Sequel speaks MCP, so it works in Claude Code, Cursor, ChatGPT and anything else that
        does. Pick your client and run the line it gives you.
      </p>

      <div className="my-6">
        <InstallButton url={mcpUrl} layout="row" />
      </div>

      <p>
        There is no API key in that command. Your client opens a browser, you sign in and approve
        it there, and the token goes to the client rather than through your clipboard.
      </p>

      <h2 id="prompt">Teach it to use the tools well</h2>
      <p>
        An agent left to itself reaches for the model it has read about most. Paste this in so it
        searches first, checks the schema, and spends your money deliberately.
      </p>
      <SystemPrompt>{GENERATE_PROMPT}</SystemPrompt>

      <h2 id="ask">Then just ask</h2>
      <p>
        Describe the job rather than the model — &ldquo;four product shots on seamless white, warm
        side light&rdquo;, &ldquo;six seconds of the lamp flickering on&rdquo;. The agent picks
        what fits the brief and the budget, and every run comes back with its cost attached.
      </p>

      <h2 id="next">Where to go next</h2>
      <ul>
        <li>
          <a href="/docs/search">Search</a> — how a job description becomes a model.
        </li>
        <li>
          <a href="/docs/generate">Generate</a> — single runs, batches and reference images.
        </li>
        <li>
          <a href="/docs/tasks">Tasks</a> — video is asynchronous; this is how it comes back.
        </li>
        <li>
          <a href="/docs/mcp">MCP tools</a> — the three tools your agent is calling.
        </li>
      </ul>
    </>
  );
}

export function ForDevelopers() {
  return (
    <>
      <h1>For developers</h1>
      <p className="lead">
        The same catalogue over plain HTTP, for when generation is part of your product rather
        than part of your chat.
      </p>

      <h2 id="install">Install</h2>
      <Code lang="bash">{`npm i @sequelsh/core`}</Code>

      <Code>{`import { Sequel } from '@sequelsh/core';

const sequel = new Sequel({ apiKey: process.env.SEQUEL_API_KEY });

const task = await sequel.run({
  model: 'black-forest-labs/flux-1-schnell',
  prompt: 'a ceramic mug on seamless white',
});

console.log(task.task.assets?.[0]?.url);`}</Code>

      <p>
        Create a key in <strong>Settings → API Keys</strong>. The SDK reads{' '}
        <code>SEQUEL_API_KEY</code> when you do not pass one.
      </p>

      <h2 id="ai-sdk">Give your own agent the tools</h2>
      <p>
        If you are building an agent rather than calling models yourself, the catalogue ships as
        Vercel AI SDK tools. Your model searches, reads a schema and generates, the same three
        calls an MCP client makes — except inside your app, on your key.
      </p>

      <Code lang="bash">{`npm i @sequelsh/core @sequelsh/ai-sdk ai`}</Code>

      <Code>{`import { anthropic } from '@ai-sdk/anthropic';
import { AISDKToolset } from '@sequelsh/ai-sdk';
import { Sequel } from '@sequelsh/core';
import { generateText, stepCountIs } from 'ai';

const sequel = new Sequel({
  apiKey: process.env.SEQUEL_API_KEY,
  toolset: new AISDKToolset(),
});

const { text } = await generateText({
  model: anthropic('claude-sonnet-5-5'),
  // search_models, get_model_schemas, run_models
  tools: await sequel.tools(),
  stopWhen: stepCountIs(8),
  prompt: 'Four product shots of a ceramic vase, warm side light. Keep it cheap.',
});`}</Code>

      <p>
        <code>tools()</code> returns the three discovery tools by default, so the prompt costs the
        same whether the catalogue holds twenty models or a thousand. When the list is short and
        fixed, <code>mode: &apos;per-model&apos;</code> gives one typed tool per model instead:
      </p>

      <Code>{`const tools = await sequel.tools({
  type: 'image',
  mode: 'per-model',
});
// generate_cf_black_forest_labs_flux_1_schnell, with that model's own schema`}</Code>

      <p>
        Per-model puts every schema in the prompt, which is fine for three models and expensive
        for twenty. <a href="/docs/sdk">SDK reference</a> has the full options.
      </p>

      <h2 id="prompt">Give your coding agent the rules</h2>
      <p>
        Paste this into whichever agent is writing the code, so it stops guessing at parameter
        names and reads the schema instead.
      </p>
      <SystemPrompt>{BUILD_PROMPT}</SystemPrompt>

      <h2 id="next">Where to go next</h2>
      <ul>
        <li>
          <a href="/docs/concepts">Concepts</a> — models, tasks, assets and cost.
        </li>
        <li>
          <a href="/docs/sdk">SDK reference</a> — every method and its options.
        </li>
        <li>
          <a href="/docs/api">API reference</a> — the HTTP surface underneath it.
        </li>
        <li>
          <a href="/docs/files">Files</a> — reference images in, assets out.
        </li>
      </ul>
    </>
  );
}
