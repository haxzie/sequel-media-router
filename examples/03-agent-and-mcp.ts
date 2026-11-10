/**
 * The agent path, and what the conversation actually looks like.
 *
 * fal's MCP is ~35 tools and Runway's is 9. This adds 2 — discovery and the schema step
 * reuse COMPOSIO_SEARCH_TOOLS and COMPOSIO_GET_TOOL_SCHEMAS, which already implement
 * search -> schema -> execute with adaptive schema inlining.
 *
 * Wire-level spec: docs/04-mcp-flow.md. Full transcript: examples/07-mcp-transcript.md.
 */
import { Composio, ComposioToolInputRequiredError } from '@composio/core';
import { OpenAIAgentsProvider } from '@composio/openai-agents';
import { Agent, run } from '@openai/agents';

const composio = new Composio({ provider: new OpenAIAgentsProvider() });

const session = await composio.create('user_123', {
  // No app toolkits — so ElevenLabs' 396 tools never come near the context window.
  toolkits: { enable: [] },
  models: {
    modalities: { enable: ['image', 'video', 'speech'] },
    budget: { maxUsdPerCall: '0.25', maxUsdPerSession: '5.00', onExceeded: 'require_approval' },
    limits: { video: { maxDurationSeconds: 10, maxResolution: '1080p' } },
    artifacts: { store: 'composio', retentionDays: 7, mount: '/mnt/files/generations' },
  },
} as Parameters<typeof composio.create>[1]);

const tools = await session.tools();
// COMPOSIO_CREATE_MEDIA + COMPOSIO_GET_GENERATION are the only additions.
// COMPOSIO_SEARCH_TOOLS gains `requires`/`max_cost_usd` and returns model results;
// COMPOSIO_GET_TOOL_SCHEMAS accepts model slugs. The rest is unchanged.

const agent = new Agent({
  name: 'Creative assistant',
  instructions:
    'Search for models before creating. State the model you chose, why, and what it cost. ' +
    'A long render returns a generation id — poll it rather than re-creating, because ' +
    'every create call is a purchase.',
  tools,
});

console.log((await run(agent, 'Make an 8-second 1080p turntable clip of this brass astrolabe, with sound.')).finalOutput);

/* ===========================================================================
   What the agent actually does — two tool calls.

   → COMPOSIO_SEARCH_TOOLS          ← the existing discovery tool, with hard constraints
     { "queries": [{ "use_case": "product turntable video from a reference photo" }],
       "requires": { "modality": "video", "capabilities": ["image-to-video"],
                     "duration_seconds": 8, "resolution": "1080p", "audio": true },
       "max_cost_usd": "0.50" }

   ← { "model_schemas": [
         { "model": { "id": "luma_labs/ray-3", "provider": "luma_labs",
                      "envelope": { "durationSeconds": {"min":1,"max":10},
                                    "resolutions": ["480p","720p","1080p"], "audio": true },
                      "media": [ { "slot": "startImage", "accepts": ["image"] },
                                 { "slot": "endImage",   "accepts": ["image"] } ],
                      "schema": { "canonical": "video.create@1",
                                  "unsupported": ["negativePrompt"] },
                      "instant": { "supported": true } },
           "quote": { "maxUsd": "0.36", "etaSeconds": 74, "bounded": true },
           "call":  { "model": "luma_labs/ray-3",
                      "input": { "durationSeconds": 8, "resolution": "1080p", "audio": true } },
           "why":   ["meets 8s (range 1-10s)", "1080p supported", "native synced audio",
                     "cheapest of 3 qualifying candidates"],
           "pitfalls": ["ignores negativePrompt"] },
         ... ],
       "considered": 23,
       "model_excluded": [ { "model": "fal_ai/kling-o3", "reason": "max duration 5s < required 8s" },
                           { "model": "bfl/flux-3-video", "reason": "no native audio" } ],
       "next_steps_guidance": ["3 models qualify. Cheapest is luma_labs/ray-3 at $0.36.",
                               "Pass `call` straight to COMPOSIO_CREATE_MEDIA with a prompt."] }

   The top candidates' schemas are inlined (`has_full_schema: true`), so the agent has the
   slot names, the price and the reasoning without a second round trip — and cannot invent
   a parameter. A lower-ranked model carries a `schema_ref` naming COMPOSIO_GET_TOOL_SCHEMAS
   instead, which is the mechanism Composio already uses for tool schemas.

   → COMPOSIO_CREATE_MEDIA
     { "model": "luma_labs/ray-3",
       "input": { "durationSeconds": 8, "resolution": "1080p", "audio": true,
                  "prompt": "slow orbit, shallow depth of field",
                  "media": { "startImage": { "artifactId": "art_7f2" } } },
       "wait": "brief" }

   ← after ~25s, if it hasn't landed:
     { "generationId": "gen_9k3m", "status": "running", "etaSeconds": 50,
       "pollAfterSeconds": 15, "pollWith": "COMPOSIO_GET_GENERATION" }

   The bounded wait is fal's idea and the right one: most images finish inside it,
   nothing hangs, and the agent gets an id instead of burning five turns polling.

   → COMPOSIO_GET_GENERATION { "generationId": "gen_9k3m" }
   ← { "status": "completed", "cost": { "usd": "0.36" },
       "artifacts": [ { "id": "art_b81", "kind": "video", "s3key": "generations/gen_9k3m/0.mp4",
                        "sandboxPath": "/mnt/files/generations/gen_9k3m/0.mp4",
                        "durationSeconds": 8, "width": 1920, "height": 1080 } ],
       "recipe": { "model": "luma_labs/ray-3", "input": {...} } }
   =========================================================================== */

// ---------------------------------------------------------------------------
// The same tools, called directly — for an executor that keeps approval on the
// execution path. (The Instant docs warn: handing the session itself to an agent
// bypasses any application-side gate. Agent instructions are not a boundary.)
// ---------------------------------------------------------------------------
const picked = await session.executeMeta('COMPOSIO_SEARCH_TOOLS', {
  queries: [{ use_case: 'british english voiceover, warm, conversational' }],
  requires: { modality: 'speech', languages: ['en-GB'] },
  max_cost_usd: '0.02',
});
console.log(picked.data);

try {
  const out = await session.executeMeta('COMPOSIO_CREATE_MEDIA' as never, {
    model: 'video:cheapest',          // intent shorthand
    input: { prompt: 'slow orbit', durationSeconds: 6,
             media: { startImage: { artifactId: 'art_7f2' } } },
    wait: 'brief',
  });
  console.log(out.data, out.resultType);
} catch (err) {
  // Budget overage and `requireApproval` reuse the existing HITL flow verbatim —
  // same error, same inputRequests/requestState, same replay. Nothing new to learn.
  if (err instanceof ComposioToolInputRequiredError) {
    console.log(err.inputRequests);
    // [{ id: 'req_1', kind: 'approval',
    //    message: 'Create 6s video with luma_labs/ray-3 for ≤ $0.27? Exceeds the $0.25 per-call cap.' }]

    await session.executeMeta(
      'COMPOSIO_CREATE_MEDIA' as never,
      { model: 'video:cheapest', input: { prompt: 'slow orbit', durationSeconds: 6 }, wait: 'brief' },
      { inputResponses: await askTheHuman(err.inputRequests), requestState: err.requestState },
    );
  }
}

// ---------------------------------------------------------------------------
// Over MCP: the same tools, zero client changes. The whole media catalog shows up
// in Claude Code / Cursor / ChatGPT the way fal's and Runway's MCPs do — except it
// spans every provider, and it costs two tools rather than thirty-five.
// ---------------------------------------------------------------------------
console.log(session.mcp.url, session.mcp.headers);

declare function askTheHuman(reqs: unknown): Promise<Record<string, never>>;
