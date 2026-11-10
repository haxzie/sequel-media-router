"""
Python parity: the same two-call flow, snake_case, matching the existing
`composio` SDK's conventions (keyword args, `user_id`, trailing options).
"""
import os

from composio import Composio

composio = Composio(api_key=os.environ["COMPOSIO_API_KEY"])
user_id = "user_123"

# ===========================================================================
# CALL 1 — the use case: soft query + hard constraints
# ===========================================================================
found = composio.models.search(
    query="cinematic product turntable from one reference photo, glossy brass",
    requires={
        "modality": "video",
        "capabilities": ["image-to-video"],
        "duration_seconds": 8,
        "resolution": "1080p",
        "audio": True,
    },
    max_cost_usd="0.50",
    prefer="cheapest",
)

for r in found.results:
    print(f"{r.model.id}  ${r.quote.max_usd}  ~{r.quote.eta_seconds}s")
    for reason in r.why:
        print(f"   + {reason}")
    for pitfall in (r.pitfalls or []):
        print(f"   ! {pitfall}")

# Auditable: every candidate that was dropped, and why.
print(found.considered)        # 23
print(found.excluded)          # [{'model': 'fal_ai/kling-o3', 'reason': 'max duration 5s < required 8s'}, ...]
print(found.relaxations)       # [{'drop': 'audio', 'would_add': 6, 'cheapest_usd': '0.12'}, ...]

# ===========================================================================
# CALL 2 — create. The result carries the mapped call; add the inputs.
# ===========================================================================
best = found.results[0]

generation = composio.models.create(
    user_id=user_id,
    model=best.call.model,
    input={
        **best.call.input,                                  # duration/resolution/audio, already mapped
        "prompt": "slow orbit, shallow depth of field",
        "media": {"start_image": {"s3key": "uploads/astrolabe.png"}},
    },
    max_cost_usd="0.50",            # pre-flight; rejected before spending, not refunded after
    idempotency_key="order_8831:hero",
)

print(generation.status, generation.model, generation.cost.usd, generation.timings.seconds)

art = generation.artifacts[0]
print(art.s3key, art.sandbox_path, art.duration_seconds, f"{art.width}x{art.height}")

for w in generation.warnings:
    print(f"[{w.code}] {w.field or ''} {w.message}")

# Replayable, diffable, shareable.
composio.models.create(
    user_id=user_id,
    model=generation.recipe.model,
    input={**generation.recipe.input, "seed": 7},
)

# ===========================================================================
# Or skip naming a model: the use case IS the selector. Same filter, same
# `excluded` accounting — which is the only reason fusing them is safe.
# ===========================================================================
auto = composio.models.create(
    user_id=user_id,
    model={
        "modality": "video",
        "prefer": "cheapest",
        "requires": {"duration_seconds": 8, "resolution": "1080p", "audio": True},
        "max_cost_usd": "0.50",
        "fallback": ["fal_ai/veo-3"],
    },
    input={"prompt": "slow orbit", "media": {"start_image": {"artifact_id": "art_7f2"}}},
)
print(auto.model, auto.routing.why, auto.routing.excluded)

# Dry-run the router without executing. A router you can't dry-run is unshippable.
decision = composio.models.route(
    model={"modality": "video", "prefer": "fastest", "requires": {"audio": True}},
    input={"duration_seconds": 8},
)
print(decision.chose, decision.considered, decision.excluded)

# ===========================================================================
# Long renders: return immediately, pick it up in the webhook
# ===========================================================================
job = composio.models.create(
    user_id=user_id,
    model={"modality": "video", "prefer": "best"},
    input={"prompt": "a city at dusk, drone descent", "duration_seconds": 20, "resolution": "4k"},
    wait="none",                                  # ~200ms
    webhook_url="https://myapp.com/hooks/composio",
    idempotency_key="order_8831:establishing",
)
print(job.id, job.status, job.eta_seconds)        # gen_... queued 240
done = job.wait(timeout_seconds=600)              # or handle media.generation.completed

# ===========================================================================
# Agent path: three tools, policy on the session
# ===========================================================================
from composio_openai_agents import OpenAIAgentsProvider  # noqa: E402

composio_agents = Composio(provider=OpenAIAgentsProvider())

session = composio_agents.sessions.create(
    user_id=user_id,
    toolkits={"enable": []},        # no app toolkits; models arrive via the models policy
    models={
        "modalities": {"enable": ["image", "speech", "video"]},
        "budget": {
            "max_usd_per_call": "0.25",
            "max_usd_per_session": "5.00",
            "on_exceeded": "require_approval",
        },
        "limits": {"video": {"max_duration_seconds": 10, "max_resolution": "1080p"}},
        "artifacts": {"store": "composio", "retention_days": 7},
    },
)

tools = session.tools()
# COMPOSIO_CREATE_MEDIA + COMPOSIO_GET_GENERATION are the only additions; discovery and
# the schema step reuse COMPOSIO_SEARCH_TOOLS / COMPOSIO_GET_TOOL_SCHEMAS. See
# docs/04-mcp-flow.md.

from composio.exceptions import ToolInputRequiredError  # noqa: E402

try:
    out = session.execute_meta(
        "COMPOSIO_CREATE_MEDIA",
        arguments={
            "model": "video:cheapest",
            "input": {"prompt": "slow orbit", "duration_seconds": 6},
            "wait": "brief",            # ~25s, then a generation id + ETA
        },
    )
    print(out.data, out.result_type)
except ToolInputRequiredError as err:
    # Budget overage reuses the existing HITL flow unchanged.
    print(err.input_requests)
    # repeat the same call with input_responses=... and request_state=err.request_state
