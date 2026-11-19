import { PathCard, Paths } from '../parts';

/*
 * The clients a creator already has open, and the stack the SDK is written
 * for. Tones are each brand's own, except Bun's — its cream is a background
 * colour, not a tile colour, and a white glyph on it would vanish.
 */
const AGENTS = [
  { id: 'claude', logo: '/clients/claude.svg', tone: '#D97757' },
  { id: 'chatgpt', logo: '/clients/chatgpt.svg', tone: '#10A37F' },
  { id: 'gemini', logo: '/clients/gemini.svg', tone: '#4285F4' },
];

const STACK = [
  { id: 'typescript', logo: '/clients/typescript.svg', tone: '#3178C6' },
  { id: 'bun', logo: '/clients/bun.svg', tone: '#1c1a17' },
  { id: 'nextjs', logo: '/clients/nextjs.svg', tone: '#0a0a0a' },
];

/**
 * Two audiences arrive here and they want opposite things.
 *
 * One wants their agent to make a picture in the next minute. The other
 * wants to write software that makes pictures. This page used to try to
 * serve both in sequence, which meant each reader scrolled past half a page
 * written for someone else. Now it asks one question and gets out of the
 * way; each door opens on a page that ends where its reader is done.
 */
export function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p className="lead">
        Sequel puts image, video and audio models behind one connection. There are two ways in —
        pick the one that sounds like you.
      </p>

      <Paths>
        <PathCard
          label="MCP"
          marks={AGENTS}
          title="For creators"
          body="Give the agent you already use the ability to generate. One command, no API key."
          points={[
            'Works in Claude Code, Cursor and ChatGPT',
            'A system prompt that makes it choose well',
            'Describe the job, not the model',
          ]}
          href="/docs/creators"
          cta="Connect your agent"
        />

        <PathCard
          label="SDK and API"
          marks={STACK}
          title="For developers"
          body="The same catalogue over plain HTTP, for when generation is part of your product."
          points={[
            'npm i @sequelsh/core, then one call',
            'A system prompt for your coding agent',
            'Keys, tasks, webhooks and assets',
          ]}
          href="/docs/developers"
          cta="Build with the SDK"
        />
      </Paths>

      <h2 id="either">Either way</h2>
      <p>
        It is one account and one bill. Every run is priced before it starts and attributed after
        it finishes — whether it came from an agent over MCP or from your own code over HTTP.
      </p>
    </>
  );
}
