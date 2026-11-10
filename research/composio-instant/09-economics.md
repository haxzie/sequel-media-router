# 09 — Unit economics

*As of 2026-11-10. Arithmetic marked **[ESTIMATE]** is ours. Every price states
resolution and audio flag where the provider distinguishes them.*

## The central fact: take rate on frontier models is ~zero

This was verified independently across nine platforms by arithmetic against the
labs' own list prices.

| Model | Lab list | Reseller price | Markup |
| --- | --- | --- | --- |
| **FLUX 3 Image** 768px / 1K / 1.5K / 2K / 4K | BFL $0.041 / $0.048 / $0.07 / $0.10 / $0.607 | **Replicate: identical to three decimals in all five tiers** | **0.0%** |
| **Veo 3.1** 720p/1080p + audio | Google **$0.40/s** | Runway Dev $0.40 · Replicate $0.40 · Segmind $0.40 · Eachlabs $0.40 | **0.0%** |
| **Kling 4.0** 720p | Kuaishou $0.154/s | **$0.157/s at Replicate, fal, Runway Dev *and* WaveSpeed** | **+1.9%** |
| **Kling 4.0** 1080p | Kuaishou $0.231/s | $0.235/s at the same four | **+1.7%** |
| **Kling 4.0 Flash** 720p | Kuaishou $0.092/s | Replicate $0.094/s | **+2.2%** |
| **Runway Gen-4.5** | Runway Dev $0.12/s | **Krea API $0.12/s** | **0.0%** |
| **Nano Banana** | Google $0.039 | fal $0.0398 · Segmind $0.03999 · Eachlabs $0.04 | **+2.6%** |
| **Nano Banana 2** 0.5K | Google $0.045 | WaveSpeed $0.045 | **0.0%** |
| **FLUX.2 [pro]** | BFL "from $0.03" | Together $0.030 | **~0%** |
| **Seedance 2.5** 720p | BytePlus $0.2312/s | Replicate $0.2312/s | **0.0%** |

And Hugging Face states the principle outright:

> *"Hugging Face charges you the same rates as the provider, with no additional
> fees. We just pass through the provider costs directly."*
> — [HF Inference Providers docs](https://huggingface.co/docs/inference-providers/pricing)

**Conclusion: do not model a markup. Model a wholesale rate card you have to
negotiate.** The labs set the shelf price and resellers appear to be
contractually barred from undercutting it; the reseller's margin is an invisible
wholesale discount.

## Where a positive take rate does exist

Three narrow places, all verified:

### 1. Google's higher image tiers — +12% to +25%

| Model | Google | Resellers | Markup |
| --- | --- | --- | --- |
| Nano Banana Pro 1K/2K | **$0.134** | $0.15 (fal, Replicate, Eachlabs, Krea); $0.14 (WaveSpeed); $0.15227 (Segmind) | **+4.5% to +13.6%** |
| Nano Banana Pro 4K | **$0.24** | $0.30 (fal, Replicate, Eachlabs); $0.27273 (Segmind) | **+13.6% to +25.0%** |
| Nano Banana 2 1K | $0.067 | fal $0.08 | **+19%** |

### 2. The labs' own "fast" and low tiers — +25% to +100%

With the Veo ambiguity resolved against Google's actual rate card (720p+audio
$0.10/s, 1080p+audio $0.12/s):

| Channel | Veo 3.1 Fast | vs $0.12 (1080p) | vs $0.10 (720p) |
| --- | --- | --- | --- |
| **WaveSpeed** | $0.10/s | **−17%** | **0%** |
| **fal, Runway Dev** | $0.15/s | **+25%** | **+50%** |
| **Replicate** | $0.20/s | **+67%** | **+100%** |

Same pattern on Kling's lower tiers: Eachlabs takes **+19%** on Kling v3 Pro's
floor rate and Motion Control, against **+4.1%** at the ceiling.

### 3. Geographies the lab won't serve — up to +105%

**ByteDance's official Seedance route is not sold in the US, Canada, UK,
Australia or New Zealand.** BytePlus publishes an allowlist of ~40 markets; the
China route (Volcano Engine Ark) requires real-name verification and RMB payment.

The consequence, and the cleanest statement of why tier 3 of the market exists:

> *"US, UK, Canadian and Australian teams cannot buy the official door at the
> official price, which is exactly why the reseller market above exists and why
> reseller rates carry a margin over the ModelArk token rate."*
> — [CellCog](https://cellcog.ai/blog/seedance-2-5-pricing/)

Observed Seedance 2.5 720p markups over BytePlus's $0.2312: Segmind +3%, reAPI
+15%, EvoLink +28%, Atlas +30%, Kie.ai +36%, WaveSpeed +56%, Higgsfield API +40%,
**fal +105%**.

A second driver is **minimum commitments**: Kling's Open Platform sells prepaid
packs from **$9.80 up to $7,560**, with one source putting practical API access at
**$700+ minimum**, and subscription credits grant **zero** API access in either
direction. A developer who wants $20 of Kling has no official option.

**This revenue is real today and is a melting ice cube.** It exists because of
policy choices that could reverse in a quarter.

## The four actual sources of margin

Every company studied has picked one or more of these. None of them is resale
spread.

### 1. GPU-time arbitrage on dedicated deployments

H100 per hour, all read today:

| Provider | $/hr | Billing unit |
| --- | --- | --- |
| **Novita (spot)** | **$1.70** | hour |
| **Novita (on-demand)** | $3.39 | hour |
| **Modal** | $3.95 | **second** |
| Together (cluster) | $3.99 | hour |
| **fal (floor)** | **$2.49** | second |
| fal (list) | $4.50 | second |
| Replicate | $5.49 | **second** |
| Together (dedicated) | $5.49 | hour |
| Baseten | $6.50 | **minute** |
| Fireworks | $8.00 | GPU-second |
| **Segmind** | **$9.00** | second |

Replicate's $5.49 is **1.4x Modal's and 3.2x Novita's spot**. Segmind's $9.00 is
**~2–3x its own RunPod supplier**. Those spreads are the real gross margin in the
category — **roughly 30–40% at 100% utilization**, and materially lower in
practice because Replicate eats setup and idle time on public models.

**Billing unit matters as much as the rate.** Per-minute billing (Baseten) against
per-second (Modal, Replicate, fal) is a large effective difference for
sub-second image generation.

### 2. Own-brand and post-trained models — 100% take

- **fal's H3 Max**: its own post-train of MiniMax's open H3 weights, claimed at
  **~35x the throughput of MiniMax's own endpoint**, sold at **$0.03/s**. "FLUX 3
  Max, post-trained by fal" is the same play.
- **Eachlabs**: **85 first-party SKUs** out of ~655 — more than any third-party
  provider except Alibaba.
- **WaveSpeed**: `wavespeed-ai/` models (Z-Image Turbo at $0.005/img,
  `openjutsu/object-swap`, `minimax-h3` with 13 endpoints) rank in its own top 25.
- **Canva's CRAFT-1**, built explicitly to escape COGS.

### 3. Capability variants the labs don't ship

**The most defensible of the four**, because it requires engine-level engineering
rather than BD. WaveSpeed exposes **MiniMax H3 LoRA and ControlNet-union
endpoints that MiniMax itself does not**. Pruna's distilled FLUX and Z-Image
variants carry **225.1M runs on Replicate**. Turbo tiers, video-extend,
talking-avatar, motion-control and the editing verbs in
[04-models-video.md](04-models-video.md) all fall here.

### 4. Credit breakage

The consumer tier's actual margin. See
[10-credit-system-precedents.md](10-credit-system-precedents.md) for mechanics.

## The app-vs-API spread — the finding that matters most for an API-first product

**Every company studied charges 2–5x more per credit in its consumer app than in
its own API, for identical compute.**

| Company | App rate | Own API rate | Spread |
| --- | --- | --- | --- |
| **Runway** | $0.0240/cr (Standard monthly) | **$0.0100/cr** | **1.92x–3.0x** |
| **Luma** (Uni-1.1 image) | 30 cr = $0.090 | 14 cr = **$0.042** | **2.14x** |
| **Krea** (Seedance-class 5s) | ~870 units ≈ $1.52 | ~$0.40 | **2.3x–3.8x** |
| **Picsart** (standard image) | $0.063–0.105 | **$0.0198–0.0226** | **2.8x–5.3x** |

Worked Veo 3.1 example across every Runway door [ESTIMATE]:

| Channel | $/s | vs Google $0.40 |
| --- | --- | --- |
| **Runway Dev API** | **$0.400** | **0%** |
| Runway app, Max annual | $0.320 | −20% |
| Runway app, Pro annual | $0.498 | +24% |
| Runway app, Pro monthly | $0.622 | +56% |
| **Runway app, Standard monthly** | **$0.960** | **+140%** |

**The self-serve app is the high-margin product in every single case; the API is
the land-grab.** An API-first product is structurally choosing the thin side of
this trade. That is not a reason not to do it — it is a cost to price in
deliberately, and it is probably why Fireworks exited and why Replicate sold for
$57.4M.

## Tier arbitrage against small customers

Spreads for identical compute, top tier to bottom:

| Company | Spread | Notes |
| --- | --- | --- |
| **Runway** | **3.0x** | $0.0240 (Standard monthly) → $0.0080 (Max annual) |
| **Krea** | 1.9x | **Business is the *most expensive* per unit** — it buys seats and governance |
| **Leonardo** | 1.76x | $1.412 → $0.800 per 1,000 tokens |
| **Luma** | 1.8x | Only 1.5x on monthly plans |
| **Picsart** | **1.9x inverted** | **Ultra costs *more* per credit than Pro** — "5x Pro" delivers 3x credits for 5.7x price |
| **OpenArt** | 1.55x | |
| **Adobe** | **1.0x** | **Flat $0.005/credit at every tier, only a 20% break at $199.99** — no volume discount at all |

## Selling below cost as an acquisition strategy

The consumer platforms sell frontier models **below the lab's list price** and
make it back on breakage:

| Platform | Model | List | Their price | Delta |
| --- | --- | --- | --- | --- |
| **Magnific** | Nano Banana 2 @2K | $0.101 | **$0.054** | **−46%** |
| **Magnific** | Nano Banana Pro 1K/2K | $0.134 | **$0.054** | **−60%** |
| **Higgsfield** | Nano Banana Pro | $0.134 | **$0.098** | **−27%** |
| **OpenArt** | Veo 3.1 Standard 4s, Wonder annual | $1.60 | **$0.47** | **−71%** |
| **OpenArt** | Veo 3.1 Standard 4s, Starter monthly | $1.60 | **$0.99** | **−38%** |
| **Luma** | Veo 3.1, Ultra annual | $0.40/s | **$0.233/s** | **−42%** |
| **AI/ML API** | Veo 3.1 | $0.40/s | **$0.20/s** | **−50%** ⚠️ |
| **Segmind** | Seedance 2.0 Fast | BytePlus $5.60/M tok | **$2.80/M tok** | **−50%** ⚠️ |

Three candidate explanations, none settled by this research:
1. The lab's posted price is a rack rate and these platforms hold a **60–75%
   volume discount**, making the true take rate positive but invisible.
2. It is a **deliberate loss leader**, recovered on blended mix and breakage.
   OpenArt's own footnote concedes a **1.56x spread for identical compute**
   between its $7 and $120 plans.
3. **Credits are sold, not consumed** — monthly credits don't roll over, and
   realistic image cost runs **5–50 credits against a "~1 credit/image"**
   marketing claim.

⚠️ The two flagged rows are the diligence question. Selling a proprietary closed
model at half the vendor's list is not authorized-reseller economics. Segmind's
own Seedance 2.5 rate moved **$6.56 → $11.263/M tokens in under a month (+72%)** —
the signature of a cheap upstream route being repriced.

## Flat-rate bundles cannot absorb frontier video

**Canva Pro: $12.00/mo including up to 20 Veo 3 "Ultra" clips ⇒ ~$0.60 of implied
revenue per clip against $3.20–6.00 of wholesale cost — a 5x to 10x negative gross
margin at full utilisation** [ESTIMATE]. AI Pass at ~$100/mo for ~800 Ultra clips
implies **~$2,560 of COGS against $100 of revenue**.

These are insurance products priced on low-single-digit utilisation. Hence Ultra
is hard-locked on Free, and overage is a throttle ("short pauses") rather than a
cutoff.

**Any aggregator competing with a bundler on posted per-unit price wins on paper
and loses on the bundle.** It is worth saying so explicitly rather than competing
on a comparison the bundler can always win.

## Reference floors for build-vs-buy

The numbers a CFO will put next to any list price:

| Workload | Measured cost | Source |
| --- | --- | --- |
| **SDXL image** (A10G, 1.5s) | **$0.000491/image** | Modal's own published math |
| **FLUX.2 [dev]** (B200 FP4, 0.98s) | **$0.00170** (Modal) / **$0.00223** (Together cluster) / **$0.00272** (Baseten) | Derived from Baseten's measured latency |
| **Qwen-Image** (B200, 0.87s) | $0.00151 (Modal) / $0.00241 (Baseten) | same |
| **Pruna P-Image** | **$0.005/generation** | Pruna marketing |

Against those floors, Together's FLUX.2 [dev] at **$0.0154/img is 5.7x–9.0x raw
GPU cost**, and its Qwen-Image at $0.0058 is ~2.4–3.8x. **This is where real
margin on open weights lives** — and the reason it exists is that **BFL hosts no
[dev] API**, so there is no list price to be anchored to.

## OpenRouter as the benchmark to argue against

**5.5% on credit purchases** (8% Business, 5% crypto, **$0.80 minimum**), **no
per-token markup**; BYOK free to $25,000/month then 5% of the excess. ~$160M
annualized by Aug 2026 [ESTIMATE — Sacra] on **~$3B+ of annualized inference
spend** flowing through. **Acquired by Stripe for >$7B** — roughly 45x revenue.

The **$0.80 floor is regressive**: a $5 top-up pays **16% effective**, and the
rate doesn't normalise to 5.5% until ~$15+.

**The lesson:** a transparent ~5% posted fee with zero model markup is a
venture-scale business at sufficient volume, and what the acquirer paid for was
the billing relationship and the spend data.

**The counter-lesson:** that 5% sits on *text* volume, orders of magnitude larger
in token terms than media. A media router at 5% needs either much higher
per-call revenue — it has that, a Veo second is ~$0.40 against fractions of a
cent for tokens — or a different margin source. fal chose the latter and owns the
compute.

## Not reached

- **Any provider's actual wholesale rate card or published volume-discount
  tiers.** Everything above about wholesale discounts is inferred from observed
  retail spreads. This is the biggest gap in the file.
- **Gross margin disclosure from any aggregator.** fal, Higgsfield, Replicate and
  Together have all declined to publish it. Together's ~45% is a Sacra estimate.
- **The WaveSpeed Turbo and Claude Opus 5.5 anomalies**, both priced below the
  vendor's standard list with no explanation found.
- **Egress, storage and asset-hosting costs**, which no platform breaks out and
  which are non-trivial for video.
