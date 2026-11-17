import { InstallButton } from '@/components/landing/install-button';
import { Code, SystemPrompt } from '../parts';
import { BUILD_PROMPT, GENERATE_PROMPT } from './system-prompts';

/**
 * Two audiences arrive here and they want opposite things.
 *
 * One wants their agent to make a picture in the next minute. The other
 * wants to write software that makes pictures. Sending both down one path
 * loses whichever it was not written for, so the page splits immediately
 * and each half ends in something you can paste.
 */
export function GettingStarted({ mcpUrl }: { mcpUrl: string }) {
  return (
    <>
      <h1>Getting started</h1>
      <p className="lead">
        Sequel puts {''}
        image, video and audio models behind one connection. There are two ways in: give your
        agent the ability to generate, or build on the SDK yourself.
      </p>

      <h2 id="generate">Generate with your agent</h2>
      <p>
        Connect Sequel to Claude Code, Cursor, ChatGPT or anything else that speaks MCP. Your
        agent searches the catalogue, reads a model&rsquo;s schema and generates — with nothing
        for you to integrate.
      </p>

      <div className="my-6 max-w-[520px]">
        <InstallButton url={mcpUrl} />
      </div>

      <p>
        There is no API key in that command. Your client opens a browser, you sign in and
        approve it there, and the token goes to the client rather than through your clipboard.
      </p>

      <p>Paste this into your agent so it uses the tools well:</p>
      <SystemPrompt>{GENERATE_PROMPT}</SystemPrompt>

      <h2 id="build">Build with Sequel</h2>
      <p>
        The SDK is the same catalogue over plain HTTP, for when generation is part of your
        product rather than part of your chat.
      </p>

      <Code lang="bash">{`npm i @sequelsh/core`}</Code>

      <Code>{`import { Sequel } from '@sequelsh/core';

const sequel = new Sequel({ apiKey: process.env.SEQUEL_API_KEY });

const task = await sequel.run({
  model: '@cf/black-forest-labs/flux-1-schnell',
  prompt: 'a ceramic mug on seamless white',
});

console.log(task.task.assets?.[0]?.url);`}</Code>

      <p>
        Create a key in <strong>Settings → API Keys</strong>. The SDK reads{' '}
        <code>SEQUEL_API_KEY</code> when you do not pass one.
      </p>

      <p>
        And paste this into whichever agent is writing the code, so it stops guessing at
        parameter names:
      </p>
      <SystemPrompt>{BUILD_PROMPT}</SystemPrompt>

      <h2 id="next">Where to go next</h2>
      <ul>
        <li>
          <a href="/docs/concepts">Concepts</a> — models, tasks, assets and cost.
        </li>
        <li>
          <a href="/docs/search">Search</a> — finding a model by use case.
        </li>
        <li>
          <a href="/docs/generate">Generate</a> — single runs, batches and reference images.
        </li>
        <li>
          <a href="/docs/sdk">SDK reference</a> and <a href="/docs/api">API reference</a>.
        </li>
      </ul>
    </>
  );
}
