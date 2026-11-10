# Wire transcript: an agent making an 8-second product video

Every MCP call and response for one real task, over `session.mcp.url`. Two existing tools,
two new ones. Spec in [`docs/04-mcp-flow.md`](../docs/04-mcp-flow.md).

**Setup.** A session with media enabled and a budget:

```ts
const session = await composio.create('user_123', {
  toolkits: { enable: ['googledrive'] },
  models: {
    modalities: { enable: ['image', 'video'] },
    budget: { maxUsdPerCall: '0.50', maxUsdPerSession: '5.00', onExceeded: 'require_approval' },
    artifacts: { store: 'composio', mount: '/mnt/files/generations' },
  },
});
// session.mcp.url → point any MCP client at it
```

**User:** *"Take the astrolabe photo from my Drive and make an 8-second 1080p turntable
video with sound. Keep it under 50 cents."*

---

## 1 · Find the photo — ordinary tool discovery, unchanged

```jsonc
→ COMPOSIO_SEARCH_TOOLS
{ "queries": [{ "use_case": "find an image file in Google Drive by name" }] }

← { "results": [{ "index": 0,
      "primary_tool_slugs": ["GOOGLEDRIVE_FIND_FILE"],
      "model_slugs": [],                                    // nothing media-ish matched
      "toolkits": ["googledrive"] }],
    "tool_schemas": { "GOOGLEDRIVE_FIND_FILE": { "has_full_schema": true, "...": "..." } },
    "model_schemas": {},
    "toolkit_connection_statuses": [
      { "toolkit": "googledrive", "has_active_connection": true }],
    "next_steps_guidance": ["Run GOOGLEDRIVE_FIND_FILE with the file name."] }
```

One search tool, two result kinds. This query returned only tools; the next returns only
models; a query like *"generate a thumbnail and upload it to Drive"* returns both. That is
the reason discovery isn't split.

```jsonc
→ COMPOSIO_MULTI_EXECUTE_TOOL
{ "tools": [{ "tool_slug": "GOOGLEDRIVE_FIND_FILE",
              "arguments": { "name_contains": "astrolabe" } }] }

← { "results": [{ "successful": true,
      "data": { "files": [{ "id": "1AbC…", "name": "astrolabe.png",
                            "mime_type": "image/png" }] } }] }
```

## 2 · Find a model — the same search tool, now with hard constraints

```jsonc
→ COMPOSIO_SEARCH_TOOLS
{ "queries": [{ "use_case": "cinematic product turntable video from one reference photo" }],
  "requires": { "modality": "video", "capabilities": ["image-to-video"],
                "duration_seconds": 8, "resolution": "1080p", "audio": true },
  "max_cost_usd": "0.50",
  "prefer": "cheapest" }
```

```jsonc
← {
  "results": [{
    "index": 0,
    "use_case": "cinematic product turntable video from one reference photo",
    "primary_tool_slugs": [],
    "model_slugs": ["luma_labs/ray-3", "fal_ai/veo-3-fast", "runway/gen-4.5"],
    "toolkits": ["luma_labs", "fal_ai", "runway"],
    "execution_guidance": "Pass the still in media.start_image — a URL inside `prompt` is ignored.",
    "known_pitfalls": ["ray-3 ignores negative_prompt",
                       "veo-3-fast bills the full duration even on a rejected render"],
    "recommended_plan_steps": ["COMPOSIO_CREATE_MEDIA with luma_labs/ray-3"]
  }],

  "model_schemas": {
    // Rank 1-2: schema inlined, so no second round trip.
    "luma_labs/ray-3": {
      "model_slug": "luma_labs/ray-3", "provider": "luma_labs", "modality": "video",
      "has_full_schema": true,
      "canonical": "video.create@1",
      "input_schema": {
        "type": "object",
        "properties": {
          "prompt": { "type": "string" },
          "media": { "type": "object", "properties": {
            "start_image": { "$ref": "#/$defs/media_ref" },
            "end_image":   { "$ref": "#/$defs/media_ref" } } },
          "duration_seconds": { "type": "integer", "minimum": 1, "maximum": 10 },
          "resolution": { "enum": ["480p", "720p", "1080p"] },
          "aspect_ratio": { "enum": ["16:9", "9:16", "1:1"] },
          "audio": { "type": "boolean" },
          "seed": { "type": "integer" }
        },
        "required": ["prompt"]
      },
      "envelope": { "duration_seconds": { "min": 1, "max": 10 },
                    "resolutions": ["480p","720p","1080p"], "audio": true },
      "media": [{ "slot": "start_image", "accepts": ["image"] },
                { "slot": "end_image",   "accepts": ["image"] }],
      "unsupported": ["negative_prompt"],
      "quote": { "max_usd": "0.36", "eta_seconds": 74, "bounded": true },
      "instant": { "supported": true },
      "call": { "model": "luma_labs/ray-3",
                "input": { "duration_seconds": 8, "resolution": "1080p", "audio": true } },
      "why": ["meets 8s (range 1-10s)", "1080p supported", "native synced audio",
              "cheapest of 3 qualifying candidates"]
    },

    "fal_ai/veo-3-fast": {
      "model_slug": "fal_ai/veo-3-fast", "provider": "fal_ai", "modality": "video",
      "has_full_schema": true,
      "quote": { "max_usd": "0.44", "eta_seconds": 38, "bounded": true },
      "call": { "model": "fal_ai/veo-3-fast",
                "input": { "duration_seconds": 8, "resolution": "1080p", "audio": true } },
      "why": ["meets 8s", "2x faster than ray-3 at p50"],
      "...": "schema elided for brevity"
    },

    // Rank 3: schema deferred. Same `schema_ref` mechanism Composio already uses for tools.
    "runway/gen-4.5": {
      "model_slug": "runway/gen-4.5", "provider": "runway", "modality": "video",
      "has_full_schema": false,
      "quote": { "max_usd": "0.48", "eta_seconds": 55, "bounded": true },
      "why": ["meets 8s", "1080p supported"],
      "schema_ref": { "tool": "COMPOSIO_GET_TOOL_SCHEMAS",
                      "args": { "tool_slugs": ["runway/gen-4.5"] },
                      "message": "Fetch the full schema before using this model." }
    }
  },

  // Nothing is silently dropped. The agent can explain its choice; a developer can
  // verify there's no thumb on the scale.
  "model_excluded": [
    { "model": "fal_ai/kling-o3",    "reason": "max duration 5s < required 8s" },
    { "model": "bfl/flux-3-video",   "reason": "no native audio" },
    { "model": "fal_ai/veo-3",       "reason": "quote $0.64 > max_cost_usd $0.50" },
    { "model": "luma_labs/ray-2",    "reason": "max resolution 720p < required 1080p" },
    { "model": "heygen/avatar-iv",   "reason": "capability mismatch: avatar, not image-to-video" }
  ],
  "model_relaxations": [
    { "drop": "audio", "would_add": 6, "cheapest_usd": "0.12" },
    { "raise": "max_cost_usd", "to": "0.70", "would_add": 2 }
  ],

  "toolkit_connection_statuses": [
    { "toolkit": "luma_labs", "has_active_connection": false,
      "status_message": "No connection — runs on Composio Instant instead.",
      "instant_account": { "allowed_tool_slugs": ["luma_labs/ray-3"] } }
  ],
  "next_steps_guidance": [
    "3 of 23 models qualify. Cheapest: luma_labs/ray-3 at $0.36; fastest: fal_ai/veo-3-fast at $0.44.",
    "ray-3's schema is inlined — send `call.input` plus a prompt to COMPOSIO_CREATE_MEDIA.",
    "No luma_labs connection is needed; it runs on Instant.",
    "runway/gen-4.5 would need COMPOSIO_GET_TOOL_SCHEMAS first."
  ]
}
```

Note what the agent *didn't* have to do: no provider knowledge, no `get_model_schema` round
trip, no connection step (Instant covers it), and no way to pick a model that can't do 8
seconds — because those were excluded rather than ranked down.

## 3 · Generate

```jsonc
→ COMPOSIO_CREATE_MEDIA
{ "model": "luma_labs/ray-3",
  "input": {
    "prompt": "slow orbit around a brass astrolabe on dark linen, single raking light, shallow depth of field",
    "media": { "start_image": { "file_id": "1AbC…", "toolkit": "googledrive" } },
    "duration_seconds": 8, "resolution": "1080p", "audio": true
  },
  "wait": "brief",
  "max_cost_usd": "0.50",
  "idempotency_key": "chat_7781:turn_4" }
```

The Drive file is referenced, not downloaded and re-uploaded — `media_ref` accepts a
connected-toolkit file id alongside `s3key`, `artifact_id`, a URL, or a path.

```jsonc
← { "status": "running",
    "generation_id": "gen_9k3m",
    "model": "luma_labs/ray-3",
    "quoted_usd": "0.36",
    "eta_seconds": 50,
    "poll_after_seconds": 15,
    "poll_with": "COMPOSIO_GET_GENERATION",
    "message": "Render in progress. Poll COMPOSIO_GET_GENERATION in ~15s. Do NOT call COMPOSIO_CREATE_MEDIA again — that starts a second billable render." }
```

Returned after ~25s rather than hanging for 74. The anti-resubmit instruction is in the
payload because that is where the model reads it; `idempotency_key` makes a mistake free
rather than merely discouraged.

## 4 · Poll

```jsonc
→ COMPOSIO_GET_GENERATION { "generation_id": "gen_9k3m", "wait": "brief" }

← { "status": "completed",
    "model": "luma_labs/ray-3",
    "artifacts": [{
      "id": "art_b81", "kind": "video", "mime_type": "video/mp4",
      "s3key": "generations/gen_9k3m/0.mp4",
      "url": "https://files.composio.dev/…", "url_expires_at": "2026-11-11T09:00:00Z",
      "sandbox_path": "/mnt/files/generations/gen_9k3m/0.mp4",
      "bytes": 8412663, "width": 1920, "height": 1080, "duration_seconds": 8,
      "provenance": { "c2pa": true, "watermark": "invisible" }
    }],
    "cost": { "usd": "0.36", "quoted_usd": "0.36", "source": "instant" },
    "timings": { "seconds": 71 },
    "warnings": [],
    "recipe": { "model": "luma_labs/ray-3", "canonical": "video.create@1",
                "input": { "...": "..." } },
    "log_id": "log_7c2b" }
```

No bytes, no base64 — metadata and paths only. The artifact is durable in Composio's
store, not a provider CDN link that expires in 24 hours (Runway's do).

**Agent:** *"Made an 8-second 1080p turntable with sound using Luma Ray 3 — the cheapest of
3 models that could do 8s at 1080p with audio — for $0.36. Veo 3 would have been $0.64,
over your budget."*

---

## Follow-ups the flow gets for free

**Post-process without leaving the session.** The artifact is already mounted, so no
transfer step:

```jsonc
→ COMPOSIO_MULTI_EXECUTE_TOOL
{ "tools": [{ "tool_slug": "COMPOSIO_REMOTE_BASH_TOOL",
    "arguments": { "command": "ffmpeg -i /mnt/files/generations/gen_9k3m/0.mp4 -vf scale=720:-1 -t 3 /mnt/files/generations/preview.mp4" } }] }
```

**Chain into another model.** `artifact_id` where a file would go — no download, no
re-upload, no expiring URL:

```jsonc
→ COMPOSIO_CREATE_MEDIA
{ "model": "speech", "input": { "text": "Hand-finished brass.", "voice": "rachel" } }
← { "status": "completed", "artifacts": [{ "id": "art_c04", "kind": "audio", "...": "..." }] }
```

**Regenerate with one tweak.** Replay the recipe:

```jsonc
→ COMPOSIO_CREATE_MEDIA
{ "model": "luma_labs/ray-3",
  "input": { "...recipe.input": "...", "seed": 7 },
  "idempotency_key": "chat_7781:turn_6" }
```

## Two variants worth seeing

**Over budget → the existing HITL flow, no new mechanism:**

```jsonc
→ COMPOSIO_CREATE_MEDIA { "model": "fal_ai/veo-3", "input": { "duration_seconds": 8, "...": "..." } }

← MCP elicitation / ComposioToolInputRequiredError
  { "input_requests": [{ "id": "req_1", "kind": "approval",
      "message": "fal_ai/veo-3 quotes $0.64, over the $0.50 per-call cap. Approve?" }],
    "request_state": "st_9f…" }

// Repeat the identical call with input_responses + request_state. Nothing was spent.
```

**An intent instead of a slug — one call, no discovery step:**

```jsonc
→ COMPOSIO_CREATE_MEDIA
{ "model": { "modality": "video", "prefer": "fastest",
             "requires": { "duration_seconds": 8, "resolution": "1080p", "audio": true },
             "max_cost_usd": "0.50" },
  "input": { "prompt": "slow orbit", "media": { "start_image": { "artifact_id": "art_7f2" } } },
  "wait": "brief" }

← { "status": "running", "generation_id": "gen_a7x1",
    "model": "fal_ai/veo-3-fast",
    "routing": { "considered": 23, "chose": "fal_ai/veo-3-fast",
                 "why": ["fastest qualifying at p50 38s"],
                 "excluded": [{ "model": "luma_labs/ray-3", "reason": "p50 74s" }] },
    "quoted_usd": "0.44", "eta_seconds": 38, "poll_with": "COMPOSIO_GET_GENERATION" }
```

Same filter, same `excluded` accounting as search — which is the only reason fusing
discovery into creation is safe.
