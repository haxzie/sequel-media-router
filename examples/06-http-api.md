# HTTP surface

Two layers: the native REST API (what the SDKs call), and an OpenAI-compatible shim for
migrating code that already exists.

## Native REST — `/api/v3.1/models`

Follows the existing API conventions: `x-api-key`, snake_case bodies, `next_cursor`
pagination, and the same `result_type` / `log_id` envelope tool execution uses.

### Discover — the use case in, invocable models out

```http
POST /api/v3.1/models/search
x-api-key: $COMPOSIO_API_KEY

{
  "query": "cinematic product turntable from one reference photo",
  "requires": { "modality": "video", "capabilities": ["image-to-video"],
                "duration_seconds": 8, "resolution": "1080p", "audio": true },
  "max_cost_usd": "0.50",
  "prefer": "cheapest"
}
```

```json
{
  "results": [
    {
      "model": {
        "id": "luma_labs/ray-3",
        "provider": "luma_labs",
        "name": "Ray 3",
        "modality": "video",
        "capabilities": ["text-to-video", "image-to-video"],
        "envelope": { "duration_seconds": { "min": 1, "max": 10 },
                      "resolutions": ["480p", "720p", "1080p"],
                      "aspect_ratios": ["16:9", "9:16", "1:1"], "audio": true },
        "media": [ { "slot": "start_image", "accepts": ["image"] },
                   { "slot": "end_image",   "accepts": ["image"] },
                   { "slot": "references",  "accepts": ["image", "video"], "max": 4 } ],
        "schema": { "canonical": "video.create@1", "unsupported": ["negative_prompt"] },
        "price": { "unit": "second", "usd": "0.045", "committed": true },
        "latency": { "p50_seconds": 74, "p95_seconds": 190, "mode": "async" },
        "instant": { "supported": true },
        "byok": { "supported": true, "auth_config": "api_key" },
        "version": "20261101_00",
        "status": "ga"
      },
      "quote": { "max_usd": "0.36", "eta_seconds": 74, "bounded": true },
      "call": { "model": "luma_labs/ray-3",
                "input": { "duration_seconds": 8, "resolution": "1080p", "audio": true } },
      "why": ["meets 8s (range 1-10s)", "1080p supported", "native synced audio",
              "cheapest of 3 qualifying candidates"],
      "pitfalls": ["ignores negative_prompt", "bills full duration on a rejected render"]
    }
  ],
  "considered": 23,
  "excluded": [
    { "model": "fal_ai/veo-3",      "reason": "quote $0.64 exceeds max_cost_usd $0.50" },
    { "model": "fal_ai/kling-o3",   "reason": "max duration 5s < required 8s" },
    { "model": "bfl/flux-3-video",  "reason": "no native audio" }
  ],
  "relaxations": [ { "drop": "audio", "would_add": 6, "cheapest_usd": "0.12" } ],
  "next_steps_guidance": ["3 models qualify. Pass `call` to /models/create with a prompt."],
  "next_cursor": null
}
```

Two properties matter here. Each result carries `call` — the request's constraints already
mapped into that model's canonical input — so there is no mandatory schema round trip
before creating. And `excluded` accounts for every dropped candidate, because a constraint
filter you cannot audit is one you cannot trust.

`GET /api/v3.1/models?modality=video&instant=true` is the structured browse with no
semantic query. `GET /api/v3.1/models/{id}` returns one full card.

### Quote

```http
POST /api/v3.1/models/quote
{ "model": "luma_labs/ray-3",
  "input": { "durationSeconds": 8, "resolution": "1080p" } }
```

```json
{ "model": "luma_labs/ray-3", "max_usd": "0.36", "expected_usd": "0.36",
  "eta_seconds": 74, "bounded": true }
```

### Create

```http
POST /api/v3.1/models/create
{
  "user_id": "user_123",
  "model": { "modality": "video", "prefer": "cheapest", "max_cost_usd": "0.50",
             "requires": { "duration_seconds": 8, "resolution": "1080p", "audio": true } },
  "input": { "prompt": "slow orbit",
             "media": { "start_image": { "artifact_id": "art_7f2" } },
             "duration_seconds": 8, "resolution": "1080p", "audio": true },
  "max_cost_usd": "0.50",
  "wait": "block",
  "timeout_seconds": 300,
  "idempotency_key": "order_8831:hero"
}
```

```json
{
  "id": "gen_9k3m",
  "model": "luma_labs/ray-3",
  "status": "completed",
  "artifacts": [{
    "id": "art_b81", "kind": "video", "mime_type": "video/mp4",
    "s3key": "generations/gen_9k3m/0.mp4",
    "url": "https://files.composio.dev/...", "url_expires_at": "2026-11-11T09:00:00Z",
    "bytes": 8_412_663, "width": 1920, "height": 1080, "duration_seconds": 8,
    "sandbox_path": "/mnt/files/generations/gen_9k3m/0.mp4",
    "provenance": { "c2pa": true, "watermark": "invisible" }
  }],
  "cost": { "usd": "0.36", "source": "instant", "quoted_usd": "0.36" },
  "routing": { "considered": 23, "chose": "luma_labs/ray-3",
               "why": ["cheapest of 3 qualifying candidates"],
               "excluded": [{ "model": "fal_ai/veo-3", "reason": "quote $0.64 > cap $0.50" }] },
  "recipe": { "model": "luma_labs/ray-3", "canonical": "video.create@1", "input": { "...": "..." } },
  "warnings": [], "log_id": "log_...", "timings": { "seconds": 71 }
}
```

`"wait": "none"` returns `202` with `{ "id", "status": "queued", "eta_seconds" }`.
`"wait": "brief"` blocks ~25s then degrades to that queued response, adding
`poll_after_seconds` — the shape the agent tool uses so a model doesn't spend turns
polling. fal's MCP uses a 45s bound for the same reason.

`recipe` echoes the model and resolved input so a result is replayable without
reconstructing the call; `"recipe": { "store": false }` redacts the input.
`idempotency_key` is not optional hygiene here: a duplicate key returns the original
generation instead of buying a second one.

### Rest of the surface

| | |
|---|---|
| `GET /api/v3.1/models/{id}` | one model, full canonical + provider schema |
| `POST /api/v3.1/models/quote` | a committed price for a specific call, execute nothing |
| `POST /api/v3.1/models/route` | resolve an intent, execute nothing |
| `GET /api/v3.1/generations/{id}` | poll |
| `GET /api/v3.1/generations?status=running` | list |
| `POST /api/v3.1/generations/{id}/cancel` | cancel |
| `POST /api/v3.1/artifacts/{id}/url` | re-mint an expired signed URL |

### Status codes

Reuses the existing semantics rather than inventing any:

- `402` `Metering_WalletBalanceExhausted` — same as Instant today.
- `409` `Models_BudgetExceeded` — pre-flight: the quote exceeds `max_cost_usd` or the
  session's remaining budget. **Nothing was spent.** This is the code that does not exist
  today, and the gap neither fal nor Composio's Instant layer closes — fal's
  `estimate_cost` is documented as "advisory, not a quote", and Instant reports charges
  only after execution.
- `409` `Models_Unquotable` — the model cannot be bounded for this input and a strict
  `max_cost_usd` was set. Better to refuse than to let an agent spend an unknown amount.
- `428` `input_required` — approval needed; carries `input_requests` + `request_state`,
  identical to tool execution.
- `422` `Models_EnvelopeViolation` — the input exceeds the model's envelope (e.g. 20s on
  a 10s-max model), with the offending field named.

## OpenAI-compatible shim

Point an existing client at Composio and get the catalog, metering and routing without
touching the call sites. The weakest layer on discovery and the strongest on migration
cost — which is the whole reason to offer it.

```bash
curl https://api.composio.dev/v1/images/generations \
  -H "x-api-key: $COMPOSIO_API_KEY" \
  -d '{"model":"fal_ai/flux-2-pro","prompt":"a brass astrolabe","size":"1024x1365","n":2}'
```

```ts
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.composio.dev/v1',
  apiKey: process.env.COMPOSIO_API_KEY,
  defaultHeaders: { 'x-composio-user-id': 'user_123' },
});

// A Composio model id...
await client.images.generate({ model: 'bfl/flux-2-dev', prompt: '...' });

// ...or an intent string, which is where this stops being a plain shim.
await client.images.generate({ model: 'image:cheapest', prompt: '...' });
await client.audio.speech.create({ model: 'speech:fastest', input: 'hello', voice: 'rachel' });
```

Covered: `/v1/images/generations`, `/v1/images/edits`, `/v1/audio/speech`,
`/v1/audio/transcriptions`, `/v1/models`. Video has no OpenAI-compatible precedent worth
matching, so it stays on the native async endpoints.

Composio-specific fields ride in `extra_body` (`max_cost_usd`, `provider_options`), and
the response carries `x-composio-generation-id` / `x-composio-cost-usd` headers so the
native API can be used for follow-up without giving up the drop-in call site.

## Vercel AI SDK provider

```ts
import { experimental_generateImage as generateImage } from 'ai';
import { composioImage, composioSpeech } from '@composio/ai-sdk-media';

const { image } = await generateImage({
  model: composioImage('image', { prefer: 'cheapest', userId: 'user_123' }),
  prompt: 'a brass astrolabe on dark linen',
  aspectRatio: '3:4',
});
```

One small package implementing AI SDK's `ImageModel` / `SpeechModel` /
`TranscriptionModel` interfaces, and every AI-SDK app reaches the whole catalog through an
interface its developers already know.
