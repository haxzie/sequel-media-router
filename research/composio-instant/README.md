# Composio Instant — market & model landscape dossier

Research compiled **2026-11-10**. Audience: whoever is deciding whether and how
Composio should ship a unified image / video / audio generation service sold on a
single credit system to **API-first agent and app developers**.

This is a landscape dossier. It contains findings and their plain consequences.
It deliberately contains **no recommendations, no pricing proposal and no build
plan** — those are yours to make.

## Files

| File | What's in it |
| --- | --- |
| [01-market-landscape.md](01-market-landscape.md) | The five tiers of this market and how each actually makes money. Read this first. |
| [02-competitors.md](02-competitors.md) | Per-company dossiers: revenue, funding, valuation, buyer, pricing, model sourcing, weaknesses. |
| [03-models-image.md](03-models-image.md) | Image generation, editing and utility models — who owns them, where they're sold, what they cost. |
| [04-models-video.md](04-models-video.md) | Video generation plus the editing verbs (recast, relight, extend, lipsync, upscale, avatar). |
| [05-models-audio.md](05-models-audio.md) | TTS, voice cloning, music, SFX, dubbing. The one modality with real price spread. |
| [06-models-3d.md](06-models-3d.md) | Image-to-3D, mesh, world models. Lighter coverage. |
| [07-volume-concentration.md](07-volume-concentration.md) | Which models actually carry the volume, measured rather than guessed. |
| [08-partner-targets.md](08-partner-targets.md) | Provider-by-provider: does the ToS permit resale, what's the route to market, who to contact. |
| [09-economics.md](09-economics.md) | Take rates, where margin actually comes from, worked $/generation numbers. |
| [10-credit-system-precedents.md](10-credit-system-precedents.md) | How eleven platforms define a credit, and what they do about expiry, rollover and failures. |
| [11-legal-compliance.md](11-legal-compliance.md) | Indemnification, provenance, moderation obligations, geographic restrictions. |

## The five findings that matter most

1. **Nobody marks up frontier models.** Replicate's FLUX 3 price matches Black
   Forest Labs' own API to three decimals across all five resolution tiers. Kling
   4.0 is $0.157/$0.235 per second at Replicate, fal, Runway Dev *and* WaveSpeed
   simultaneously. Runway Dev sells Veo 3.1 at exactly Google's $0.40/s. The
   labs' list prices are rack rates; a reseller's margin is an invisible wholesale
   discount it had to negotiate.

2. **The reliable margin is the app-vs-API spread, which is the thin side for an
   API-first product.** The same credit costs 2–5x more in a company's consumer
   app than in its own API: Runway 1.92–3.0x, Luma 2.14x, Krea 2.3–3.8x, Picsart
   2.8–5.3x. Every one of these companies earns on the UI and runs the API near
   cost as a land-grab.

3. **Two large infra companies tried this and quit.** Fireworks AI ($1B+ ARR,
   $17.5B) deprecated image generation and audio inference outright on
   2026-06-10. Replicate sold to Cloudflare for **$57.4M** against ~$58M raised —
   a 0.16x exit. Modal and Baseten host zero closed-weight media models.

4. **Yet the developer surface is uncontested at the prosumer tier.** OpenArt is
   at ~$200M ARR with, in its own words, *"No public API is available
   currently."* And no platform anywhere ships the obvious composite:
   OpenAI-compatible `/v1/images/generations` **plus** webhooks **plus** a
   normalised cross-modality request body.

5. **Resale and "serving your own end users" are different legal questions.**
   Reselling access is prohibited essentially everywhere on self-serve terms.
   Serving your own end users through your own application is generally permitted
   and usually has its own defined contract term. A credit wallet is the second
   shape, not the first — provided you hold the accounts and never pass upstream
   credentials through.

## How to read the numbers

Every figure is tagged:

- **[REPORTED]** — a company disclosure, SEC filing, or named primary/press source.
- **[ESTIMATE]** — a third-party tracker (Sacra, Latka, Tracxn, Dealroom) or our
  own arithmetic. Several headline numbers are only available as estimates;
  **Luma has never disclosed ARR at all.**

Prices state resolution, duration unit and audio flag wherever the provider
distinguishes them. This matters more than it sounds: the same Veo 3.1 Fast
reseller price looks like parity or a 2x markup depending on which Google row you
compare it against.

## Caveats, stated plainly

- **This market re-prices weekly.** Treat every number as as-of 2026-11-10.
  Segmind's Seedance 2.5 rate moved ~72% in under a month during the research
  window.
- **Model naming moves within weeks.** Current names as of today: FLUX 3 / 3 Max,
  Kling 4.0, MiniMax H3 / H3 Max, Seedance 2.5, Seedream 5.0, Nano Banana 2 / 2.1
  / Pro, gpt-image-2.5 / 2.6, Krea 3, Qwen Image 3, Wan 3.0, LTX 2.5, Recraft V4,
  Z-Image, Grok Imagine.
- **The legal section is not legal advice.** Quoted clauses are what targeted
  queries returned, not complete readings of each agreement. Where a query found
  nothing on resale, the file says "not found in retrieved text" rather than
  treating silence as permission. All of it needs a lawyer before anyone relies
  on it.
- **Coverage is uneven and marked.** Each file ends with what it did not reach.
