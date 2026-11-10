# 07 — What actually carries the volume

*As of 2026-11-10.*

## The only public, quantitative demand data in this market

**Replicate publishes cumulative run counts per model.** Nobody else in the
category does — not fal, not Together, not Novita, not WaveSpeed, not Segmind,
not Eachlabs. That makes Replicate's Official collection the single measurable
proxy for real generative-media demand, and everything in this file comes from a
scrape of it: **423 models with visible counts, 2.74 billion cumulative runs**, of
which **~1.85B (68%) belong to media-model publishers**.

Media's *revenue* share will be considerably higher than 68%, since an image or
video run costs 10–100x a small LLM call.

**Caveat to carry:** these are Replicate's numbers, and Replicate's buyer skews
indie/prototyping. Its mix is probably more open-weight-heavy and more
image-heavy than fal's enterprise mix. It is the best available measurement, not
a census.

## By publisher

| Cumulative runs | Models | Publisher |
| --- | --- | --- |
| **1,026.8M** | 35 | **Black Forest Labs** |
| 703.9M | 13 | Meta (LLMs) |
| **225.1M** | 24 | **Pruna AI** |
| **219.1M** | 22 | **Google** |
| 156.8M | 27 | OpenAI |
| **102.1M** | 18 | **ByteDance** |
| 28.3M | 13 | Qwen |
| **27.4M** | 23 | **MiniMax** |
| 21.6M | 13 | Ideogram |
| 20.4M | 20 | Recraft |
| 18.6M | 21 | Wan-Video (Alibaba) |
| **7.8M** | 12 | **kwaivgi (Kling)** |
| 4.9M | 4 | Topaz Labs |
| 1.6M | 7 | ElevenLabs |

## By model

| Runs | Model |
| --- | --- |
| **701.2M** | `black-forest-labs/flux-schnell` |
| 123.5M | `google/nano-banana` |
| 103.5M | `nightmareai/real-esrgan` |
| 73.9M | `black-forest-labs/flux-1.1-pro` |
| 59.7M | `prunaai/z-image-turbo` |
| 54.5M | `black-forest-labs/flux-kontext-pro` |
| 53.2M | `black-forest-labs/flux-dev` |
| 46.3M | `prunaai/p-image-edit` |
| 45.8M | `prunaai/flux-fast` |
| 40.2M | `bytedance/seedream-4` |
| 37.6M | `google/nano-banana-pro` · `bytedance/seedream-4.5` |
| 37.4M | `black-forest-labs/flux-2-klein-4b` |
| 35.2M | `openai/gpt-image-2` |
| 24.5M / 24.3M | `prunaai/p-image` · `prunaai/flux-kontext-fast` |
| 22.2M | `google/nano-banana-2` |
| 15.2M | `wan-video/wan-2.2-i2v-fast` |
| 13.2M | `minimax/speech-02-turbo` |
| 4.5M | `bytedance/seedance-1.5-pro` |
| 3.2M | `kwaivgi/kling-v2.5-turbo-pro` |
| 885.7K | `google/veo-3.1-fast` |
| 677.1K | `google/veo-3.1` |
| 369.8K | `bytedance/seedance-2.5` |
| 248.6K | `black-forest-labs/flux-3-image` |
| 111.1K | `minimax/h3` |
| **15.8K** | `kwaivgi/kling-v4.0` |
| **118** | `kwaivgi/kling-v4-flash` (launched 2026-11-09) |

## Five conclusions, and what each one costs you if you ignore it

### 1. Black Forest Labs *is* the demand

**37% of all official-model runs on Replicate**, and one model — `flux-schnell` —
is **26% of total runs by itself**. FLUX is not a model on the platform; it is the
platform's traffic.

**Single-lab concentration risk is extreme.** Any unified media API that launches
without the FLUX family is not competitive on day one, and any that launches with
FLUX has one counterparty controlling a third of its volume. BFL is at ~$100M ARR
and $3.25B with Nvidia, a16z and Meta on the cap table — it does not need a new
distributor.

### 2. Pruna AI is the third-largest publisher, ahead of Google

**225.1M runs across 24 models** — from a third-party *optimization* company whose
distilled and compressed variants (`z-image-turbo`, `p-image-edit`, `flux-fast`,
`flux-kontext-fast`) carry Replicate's "Official" badge. Replicate even publishes
a first-party guide for it. Pruna's P-Image is marketed at sub-one-second and
**$0.005/generation**.

**Third-party optimizers are a distinct, under-modelled supply channel.** They are
not a lab and not an aggregator; they take open weights, make them cheap and
fast, and sell the result through someone else's distribution. For a new entrant
they are the cheapest route to a credible low-cost tier — and they are also
evidence that the "make it faster" wedge is already contested by specialists.

### 3. Video volume is tiny next to image

All twelve Kling models together are **7.8M runs — 0.8% of BFL's**. Seedance 2.5
is 369.8K. Veo 3.1 is 677.1K. MiniMax H3 is 111.1K.

**Video is high-ASP and low-count; image is the volume engine.** The marketing
attention in this market is almost entirely on video, and the run counts say that
is disproportionate. A credit system sized for video economics will be wrong
about where the requests actually come from.

### 4. New models have almost no usage for 6–12 months

FLUX 3 Image: 248.6K. Kling 4.0: **15.8K**. Kling 4.0 Flash: **118**. MiniMax H3:
111.1K. Against `flux-schnell`'s 701M.

**Day-zero availability is a marketing asset, not a revenue line.** Every platform
studied advertises day-0 access, and Krea's own featured customer review is *"It's
crazy how fast they add models. I see a new AI model on twitter and the same day
krea already offers it."* The run counts say that race wins attention and not
much traffic. Weigh that against the engineering and BD cost of being first.

### 5. Utility models are real volume

`real-esrgan` at **103.5M runs** is the third most-run media model on the
platform — an upscaler, not a generator. Background removal has more competing
suppliers than any other single task (see
[03-models-image.md](03-models-image.md)).

**The boring verbs carry traffic.** Upscale, background-removal, segmentation and
edit endpoints are cheap to serve, easy to source (several are open weights), and
apparently in constant demand.

## Corroborating signals from other platforms

Replicate's counts are the only hard numbers, but three softer signals point the
same way:

- **fal's own enterprise data:** a median enterprise deployment uses **14
  different models** (Gen Media Report Vol. 1). Breadth is consumed, not just
  advertised — which is the core argument for a unified API.
- **Artificial Analysis 2025 media survey:** fal ranked **#2 in both image and
  video endpoint adoption** behind Google AI Studio, and **#1 among
  organizations** for image APIs. Google wins individuals; the aggregator wins
  production volume. *(The 2025 page now 404s; cited via Contrary Research.)*
- **Quora/Poe case study:** fal powered **50% of Poe's video and image generation
  messages** as of Jan 2025, with **36% lower response time** and **+18% positive
  feedback** against the compared endpoint.
- **WaveSpeed's own "Most Popular" ordering** (read today) puts
  `openai/gpt-image-2.6-flare` first, then `gpt-image-2.6-sunburst`,
  `google/nano-banana-2.1`, then **Seedance 2.5 with eight distinct endpoints in
  the top 15** — consistent with image-first demand plus heavy use of video
  *editing* verbs rather than pure generation.

## The ~15 models that would cover most volume

Synthesising the run counts with the catalog presence observed across every
platform studied. Ordered by evidenced demand, not by quality:

1. **FLUX.1 schnell** — open, $0.003/MP, 701M runs
2. **FLUX.1 dev / FLUX.2 dev** — open; the margin-bearing tier since BFL hosts no dev API
3. **Nano Banana 2** — Google's volume workhorse
4. **Nano Banana Pro** — current quality leader
5. **FLUX 1.1 Pro / Kontext Pro** — 73.9M + 54.5M runs
6. **Z-Image Turbo** — open, cheapest credible tier
7. **GPT Image 2 / 2.5** — instruction following
8. **Seedream 4.5 / 5.0** — photoreal
9. **Real-ESRGAN or an equivalent upscaler** — 103.5M runs
10. **A background-removal model** (BiRefNet / RMBG / Bria) — commodity, constant demand
11. **Veo 3.1 Fast** — the video volume tier, not Veo 3.1 standard
12. **Kling 2.5 Turbo Pro** — 3.2M runs, far ahead of Kling 4.0's 15.8K
13. **MiniMax H3** — open weights, so self-hostable
14. **Wan 2.2 / 3.0** — open video
15. **ElevenLabs Turbo v2.5** plus **one open TTS** (Kokoro) — the two ends of the audio ladder
16. **A lipsync model** (Sync) — the most-demanded video editing verb
17. **Seedance 2.5** — if and only if the geo-restriction can be solved

**What is conspicuously absent from that list:** the newest flagship of every
lab. The evidence says volume sits one or two generations behind the launch
announcements.

## Not reached

- **Replicate run counts over time** — only cumulative totals were captured, so
  growth rates and decay curves are unknown. A second scrape in 30 days would
  give rates of change, which is the more useful signal.
- **fal's Gen Media Report Vol. 2**, gated behind a lead form.
- **The current Artificial Analysis media leaderboard** — the 2025 edition is
  cited second-hand and the page 404s.
- Any usage data at all for **3D, music, SFX and dubbing**.
