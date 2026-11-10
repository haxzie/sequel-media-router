# 01 — Market landscape

*As of 2026-11-10.*

## The structural fact: there is no "aggregator vs lab" axis left

Everyone is both. Three verified loops make the point better than any diagram:

1. **Runway's consumer app resells Krea Image 3**, while **Krea is a logo
   customer on Runway Dev's enterprise page** *and* a **named Luma API partner**.
2. **Adobe is simultaneously** Runway's "preferred API creativity partner", a
   Series E investor in Runway, and a Runway Dev API customer — while reselling
   Runway, Luma, Google, OpenAI, BFL, Kling, ByteDance, Topaz and ElevenLabs
   inside Firefly.
3. **Freepik, Envato, fal, Comfy, Flora, Runware, Lovart and Weavy** appear on
   *both* Luma's and Runway's partner/customer walls. The same ~15 companies buy
   from every lab and resell to each other.

And fal — the company most people would name as the category leader — lists
**Canva, Adobe, Autodesk, Shopify, Suno, Quora, World Labs, Krea, HeyGen and
Lightricks** as customers on its own pricing page. Several entries in a naive
competitive map are actually fal's resale channel.

## Five tiers, five different businesses

| Tier | Who | Buyer | How they make money | Take rate over lab list |
| --- | --- | --- | --- | --- |
| **1. Generative-media infra** | fal, Replicate (now Cloudflare) | Developers, AI-native startups, enterprise eng | GPU-second arbitrage + per-output billing; dedicated compute | **~0% on licensed flagships**; +12–25% on Google image tiers; +25–50% on "fast" tiers; up to +105% on geo-restricted models |
| **2. General inference clouds (media side)** | Together, Novita, Segmind, WaveSpeed; Modal / Baseten / Fireworks as non-participants | Same, but LLM-first | Compute margin; media is a secondary SKU | Segmind ~+3%, WaveSpeed −13% to +7%, Novita +50–100% on resold capacity |
| **3. Reseller / budget API shops** | Kie.ai, EvoLink, reAPI, Atlas Cloud, Comet API, PiAPI, Apiframe, GoAPI, 302.AI, AI/ML API, Eachlabs | Indie devs, Chinese + SEA market, app wrappers | Prepaid credits, markup, account pooling where no official API exists | **+3% to +40%**, sometimes *below* official |
| **4. Prosumer multi-model apps** | Higgsfield, Magnific (ex-Freepik), Krea, OpenArt, Pollo, Leonardo | Marketers, agencies, creators | Subscription + credits; **breakage is the margin** | Often **negative** on headline models; positive blended |
| **5. Incumbents & hyperscalers** | Adobe Firefly, Canva, Picsart; Vertex AI, Bedrock, Azure AI Foundry, Hugging Face | Enterprise, existing seat base | Seats; cloud consumption; distribution | HF explicitly **0%**; hyperscalers *are* the list price; Adobe is the only real markup (2–2.5x, images only) |

**Where it's heading:** tiers 1 and 5 are converging on zero model markup and
monetising something adjacent (compute, seats, payments). Tier 3 is pure
arbitrage on the labs' distribution gaps and shrinks as labs open official global
APIs. Tier 4 has the best unit economics and the worst customer trust.

## The two acquisitions that priced this market

**Stripe agreed to acquire OpenRouter for >$7B** (announced August 2026;
confirmed on [Stripe's own newsroom](https://stripe.com/newsroom/news/stripe-agrees-to-acquire-openrouter),
price per [Bloomberg](https://www.bloomberg.com/news/articles/2026-08-16/stripe-nears-deal-to-buy-ai-firm-openrouter-for-over-7-billion)).
OpenRouter was at **~$160M annualized by Aug 2026** [ESTIMATE — Sacra], up from
~$5M in July 2025, charging **5.5% on credit purchases with no per-token
markup**. It had been valued at $1.3B three months earlier in a CapitalG-led
Series B. **[REPORTED]**

**Cloudflare acquired Replicate for $57.4M all-cash**, closed 2025-12-01. From
Cloudflare's FY2025 10-K, verbatim: *"the Company acquired all of the outstanding
shares of Replicate… for a total purchase cash consideration of $57.4 million"*
([SEC](https://www.sec.gov/Archives/edgar/data/1477333/000147733326000016/cloud-20251231.htm)).
Against ~$58M raised and a $350M (Jul 2023) valuation, that is a **0.16x exit** —
essentially liquidation preference. **[REPORTED]**

Read together: the routing layer for **text** consolidated into infrastructure
incumbents at a 45x revenue multiple, while the pioneer of **media** aggregation
exited for 0.4% of what its closest competitor is now worth three weeks later
(fal at $16B). Nobody has consolidated media aggregation, and the company closest
to it is valued like a frontier lab rather than a reseller.

## Two companies tried this and quit

**Fireworks AI** — $1B+ annualized, $17.5B valuation, 40T tokens/day, in talks at
$30–40B — wrote this in its changelog on **2026-06-10**:

> *"Audio inference and image generation deprecation — Audio inference and image
> generation are deprecated."*
> — [docs.fireworks.ai/updates/changelog](https://docs.fireworks.ai/updates/changelog)

Its pricing pages now contain zero media rates. A company with a FLUX launch blog
and a working image API chose to kill generative media rather than compete.

**Modal** hosts not one image, video or audio *generation* model — GPU-seconds
only. Runway and Suno are customers, not competitors. **Baseten** carries six
open-weight image models and **zero closed-weight lab models** — no Veo, Kling,
Seedance, Runway, Sora, GPT Image or Nano Banana. **Kling, Runway Gen-4, Sora,
Luma, LTX and Hunyuan Video are hosted by none of the three.**

Together AI is the lone generalist contesting the lane, at roughly zero margin,
and without Kling, Runway, LTX or Hunyuan Video.

Two readings, both defensible:
- **Bear:** media inference has worse unit economics and retention than token
  inference. A dollar of GPU earns more serving Cursor's tokens.
- **Bull:** media needs a genuinely different product — async jobs, webhooks,
  asset storage, per-generation billing, 200-model catalogs, lab BD — that a
  token-serving company cannot bolt on. Three of four vacating is a vacated lane,
  not a defended one.

## The market is barbell-shaped

Five companies at **$600M–$1B+ revenue and $8–17.5B valuations** — fal,
Fireworks, Modal, Together, Baseten — three of which don't do media. Then a
cliff. Then four companies at **$1–6M ARR, ≤$2M raised, 7–23 employees**:
Eachlabs (~$1.5M, 21 staff), Novita (~$1.1M, 23 staff, **unfunded**), Segmind
(<$1.2M, **7 staff**, 552 models), WaveSpeed (revenue unknown, 18 staff, 1,000+
models).

**Replicate was the only thing in the middle, and it sold for $57.4M.** Whether
that empty middle is the opportunity or the graveyard depends entirely on whether
the margin problem documented in [09-economics.md](09-economics.md) is structural.

## Hidden supplier relationships distort any naive map

- **Novita appears to resell WaveSpeed.** Novita is named on WaveSpeed's own
  customer list, and charges **$0.08/s for MiniMax H3 @768p against WaveSpeed's
  $0.04/s** — +100%. They are a supplier/reseller pair, not comparables.
- **Eachlabs lists `Fal 10`** — ten models sourced from fal. It resells a
  competing aggregator: margin stacking plus dependency on a rival's ToS.
- **WaveSpeed sold wholesale into Replicate** at $0.04/s against Replicate's
  $0.09/s retail — a **125% channel markup to Replicate** — buying ~800K runs of
  distribution at zero CAC. **Then the channel froze at Wan 2.1 / Nov 2025** while
  `wan-video/*` and `kwaivgi/*` arrived on Replicate as first-party Official.

That last one is the cleanest case study in this dossier: **an accelerated-
inference reseller's wedge is the gap between a lab's release and its own
distribution, and that gap is closing.**

## The supply side is consolidating and going direct

| Lab | Revenue | Valuation | Channel posture |
| --- | --- | --- | --- |
| **Kling (Kuaishou)** | ~$500M ARR [ESTIMATE] | **~$18B** (~$2.98B raised, 2026-10-30) | 60M creators, 30k enterprise clients. **Broadened its own developer API at the Kling 4.0 launch, Oct 2026.** Explicitly disintermediating. |
| **ByteDance / Seedance** | — | — | **Two official surfaces at different prices**, plus Volcano Engine for China. **Geo-blocked from US/CA/UK/AU/NZ** — which hands the Western market to resellers. |
| **MiniMax** | $116.6M H1-2026 (+283%); API line **$73.9M, +703%** | **public, ~$8.2B** | Supplier, competitor and open-weights donor at once — its open H3 weights enable fal's H3 Max. |
| **Black Forest Labs** | ~$100M ARR [ESTIMATE] | $3.25B ($300M Series B; Nvidia, a16z, Meta) | FLUX on Replicate, fal, Together; "FLUX 3 Max post-trained by fal". The template for lab-plus-aggregator coexistence. |
| **OpenAI** | — | — | **Deprecated the Sora 2 models and Videos API (Mar 2026, shut down Sept 2026), no named replacement** — while shipping GPT Image through fal, Runway, Higgsfield and others. |
| **Midjourney** | ~$500M ARR [ESTIMATE] | bootstrapped | **No public API.** Sued by Disney/NBCU/DreamWorks and Warner Bros. Discovery. |

Every lab with scale is building its own developer channel. An aggregator's
defensible ground is therefore **not catalog access** — it is latency, the
unified contract, workflow lock-in, and the geographies and price points labs
won't serve.

## Platform risk, realised twice in public

**OpenArt** now shows *"Sora 2 is no longer available"*, redirecting users to
Gemini Omni Flash / MiniMax H3 / Kling 3.0. **Higgsfield** serves an equivalent
tombstone page. Two independent platforms with public evidence of a flagship
model being withdrawn from under them, inside one year.

Pair that with **Runway's Lionsgate custom model reportedly stalling** on data
sufficiency (The Wrap, Sept 2025) — the flagship studio deal's headline
deliverable did not land.

## Hugging Face is the 0% competitor

> *"Hugging Face charges you the same rates as the provider, with no additional
> fees. We just pass through the provider costs directly."*
> — [HF Inference Providers docs](https://huggingface.co/docs/inference-providers/pricing)

HF monetises the **PRO/Team subscription** instead ($2.00/month of compute
credits per seat, then pay-as-you-go), and offers two modes with identical code:
HF-routed (HF bills you, credits apply) or your own provider key (HF charges
nothing). That makes HF a distribution subsidy and the most dangerous free
competitor to any paid router.

## Not reached

- **Adobe Firefly's full third-party bundling and credit economics.** Firefly is
  now effectively an aggregator (Veo, Runway, Luma, Flux, Topaz, Moonvalley,
  Pika, ElevenLabs) inside a Creative Cloud seat — the most dangerous
  distribution in the category. Partially covered in
  [02-competitors.md](02-competitors.md); the credit math is incomplete.
- **Whether OpenRouter has moved into image/video** post-Stripe. This directly
  determines whether the canonical router becomes a direct competitor.
- **Azure AI Foundry** media pricing and posture.
