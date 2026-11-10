# 10 — Credit system precedents

*As of 2026-11-10. Credit→dollar conversions marked **[ESTIMATE]** are ours,
derived from each platform's published plan price and credit allowance.*

## What a credit is worth, across eleven platforms

| Platform | Unit | Cheapest tier | Most expensive tier | Spread |
| --- | --- | --- | --- | --- |
| **Runway** | credit | **$0.0080** (Max annual) | **$0.0240** (Standard monthly) | **3.0x** |
| **Runway Dev API** | credit | **$0.0100 flat** | — | — |
| **Higgsfield** | credit | $0.039 (PLUS annual) | **$0.0556** (auto-refill top-up) | 1.4x |
| **Luma** | credit | $0.001667 (Ultra annual) | $0.00300 (Plus monthly) | 1.8x |
| **Krea** | compute unit | $0.00105 (Pro/Max annual) | **$0.00200 (Business)** | 1.9x — **Business is dearest** |
| **Magnific** | credit | $0.00066 (Pro) | $0.000725 (Premium annual) | 1.1x |
| **OpenArt** | credit | $0.001651 (Wonder annual) | $0.0035 (Starter) | 2.1x |
| **Picsart** | credit | $0.021 (Pro annual) | **$0.040 (Ultra)** | **1.9x inverted** |
| **Leonardo** | token | $0.000800 | $0.001412 | 1.76x |
| **Adobe** | credit | **$0.005 flat at every tier** | (20% break at $199.99) | **1.0x** |
| **OpenRouter** | $1 of credit | **$1.055** (5.5% fee) | **$1.16 effective** on a $5 top-up ($0.80 min) | — |

**Two outliers worth noting.** Adobe charges the same $0.005/credit at every tier
— no volume discount at all. Picsart and Krea both charge *more* per credit at
their top tier than their middle one, because those tiers sell seats and
governance rather than compute.

## Rollover and expiry — where the margin is

| Platform | Monthly credits roll over? | Purchased credits | Notes |
| --- | --- | --- | --- |
| **Runway** | **No** on Standard/Pro; **one month** on Max | **Never expire** | **1,000-credit minimum top-up** |
| **fal Agent** | **Yes — credits roll over** | — | The only unambiguous "yes" found |
| **Higgsfield** | **No** | Add-ons expire in **90 days**; API funds expire after **1 year** | Credits forfeited on termination for cause |
| **Luma** | **No — expire at cycle end** | — | Reports of credits **voided on same-day cancel** |
| **Krea** | **No** below Business; **yes** on Business/Enterprise with customisable periods | Compute packs valid **90 days** | |
| **OpenArt** | **No** | Add-ons **roll over indefinitely but are spent FIRST** | The ordering is the mechanism |
| **Leonardo** | **Rollover Bank capped at exactly 3x the monthly allowance** | Non-expiring, but **unusable without an active subscription** | |
| **Picsart** | **No** | **Pro cannot buy top-ups at all**; non-expiring credits are an **Ultra-only paywalled privilege** | |
| **Magnific** | Annual pools don't reset monthly | — | |
| **OpenRouter** | n/a | **May expire 365 days after purchase** | |
| **ElevenLabs** | — | **"ElevenLabs has no obligation to provide notice prior to the expiration of Prepaid Credits"**; non-refundable, final sale | See [08](08-partner-targets.md) |

**Leonardo and OpenArt have opposite designs and it is instructive.** Leonardo
caps the rollover bank at 3x so unused allowance eventually evaporates. OpenArt
lets paid add-ons roll over indefinitely **but spends them first**, so the
non-rolling monthly allowance is the bucket that expires. Both end in breakage;
only one looks generous.

## Failed generations — the single loudest complaint in the entire market

| Platform | Stated policy | Reality per user reports |
| --- | --- | --- |
| **Luma** | Auto-refunded (`content_moderated`, `generation_failed`, `output_not_found`) | — |
| **Segmind** | Temporary hold sized from recent average, settled at actual; **failures not billed** | — |
| **OpenArt** | Auto-refunded **"in most cases"** | *"Failed generations sometimes still cost credits. This is the most reported bug-related complaint."* One user: a goodwill refund was given once, then *"the credits from the recent failures were not refunded."* |
| **Higgsfield** | Failures usually auto-refunded | — |
| **Kling** | Failed API tasks don't deduct | — |
| **WaveSpeed** | No charge for failed generations | *"It will also say it violates the terms when trying to make videos but nothing is violated. It says it will not charge for it, but it does… This happened 3 times to me"* |
| **fal** | — | r/n8n: *"one error after the other and also charged on every failed call"* |
| **Replicate** | **Public models: setup and idle are free**; a prediction that never starts is aborted and costs nothing | **Private/dedicated models bill setup + idle + active** — the source of every surprise-bill story |
| **Leonardo** | — | *"repeated failed attempts precisely because Leonardo's own system blocks generations"* — no refund mechanism |
| **Runway** | — | *"Discourage experimentation: Artists may hesitate to try new techniques or models, fearing the waste of credits if the output is unusable."* |

**Across every tier of this market — infra, reseller, prosumer — the same
complaint recurs: credits consumed on failed or moderation-blocked generations,
refunds refused, support unreachable.** Trustpilot scores in the self-serve tier
run 1.1 to 3.5 out of 5 largely on this.

It is the most conspicuously undefended position in the category. A contractual
"never billed for a failure" guarantee is cheap to promise and currently rare.

## The retry tax is the real price

Nobody publishes a first-pass success rate, but the arithmetic is unavoidable.
Runway Gen-4.5 at **$1.44 per 5s clip** on Standard monthly becomes **~$5.76 per
*approved* shot at a 25% usable rate** [ESTIMATE].

This is why Runway ships **Recipes** (prebuilt multi-step pipelines) and why
OpenArt ships one-click story templates: suppressing retries is worth more to the
customer than a lower headline price, and it increases the vendor's revenue per
unit of customer effort at the same time.

## "Unlimited" is always an acquisition instrument

And the exclusion list is always the third-party models. **Leonardo states the
reason outright**: third-party models *"run entirely on external servers via paid
third-party APIs, and we have no visibility into their capacity or ability to
throttle them."*

| Platform | What "unlimited" means |
| --- | --- |
| **Higgsfield** | "365-DAY UNLIMITED" on Seedream 5.0 Lite, Flux.2 Pro, Nano Banana, Kling O1 Image, GPT Image; **7-day unlimited** on Nano Banana 2 and (ULTRA only) Nano Banana Pro. Runs on a **separate, slower queue**; throttling rights reserved for "excessive" use. A moderator reportedly told a user unlimited generations could take **several hours** |
| **Magnific** | Unlimited on ~10 cheap image models on Premium+; **video and premium image variants always consume credits** |
| **OpenArt** | "Unlimited Creation" applies **only to select models during promotional windows**, with explicit throttling |
| **Krea** | "Unlimited relaxed" with the same caveats |
| **Picsart** | **"Unlimited image generations with Flex.2 Klein"** — an unmetered cheap-model lane that protects margin |
| **Adobe** | Unlimited on select models **"for the first year"** at every tier |
| **Canva** | Standard tier uncapped on paid plans under fair use; **Premium and Ultra are hard-numbered**; Ultra hard-locked on Free |

**Unlimited is only ever offered on compute the vendor can throttle.**

## Price discrimination and instability

- **Higgsfield runs at least four concurrent price lists by cohort and region**
  (PLUS $49/1,000, Starter $15/200, $19/270, Plus $59/1,200). Users report Ultra
  going **$95 → $125 → removed for some accounts**.
- **Picsart's Ultra appears to have gone ~$31.66 → $60/mo annual in ~6 months
  (~+90%)** at the same 1,500 base credits, while `/plans` and `/gold` now 404 and
  its own tutorial, comparison page and pricing page state **three different
  credit numbers for the same plan.**
- **OpenArt tunes per-model credit cost as a merchandising lever** — currently GPT
  Image 2.6 −30%, Seedream 5.5 −50%, Kling 4.0 −50% — and explains why: *"Credit
  costs for individual models are tied to the underlying costs from our AI model
  providers… we pass through the change as transparently as possible."*
- **Reseller promos are dated and vanish.** EvoLink's Seedance 1080p went **$0.528
  → $0.739 (+40%) on promo expiry**; Atlas Cloud's −20% expired the same day.
- **Canva has twice failed to pass AI COGS to SMBs via list price** — the 2024
  Teams hike of up to ~300% was reversed after backlash, then achieved via SKU
  migration when Teams was sunset in Oct 2025.

## Rate-card opacity

| Publishes per-model rates | Does not |
| --- | --- |
| **Krea** (most complete found), **Picsart**, **Runway**, **Luma**, **Adobe**, **Higgsfield API**, **fal** | **Leonardo** — no per-model token cost anywhere; calculator login-gated; `docs/pricing` 404s |
| | **OpenArt** — no credit table on any public model page |
| | **Canva** — multipliers only, never units, and consumption is **explicitly non-deterministic** by prompt complexity and router choice |

Canva's own wording: *"More complex prompts and tasks use more of your monthly AI
allowance… Tasks that use multiple AI tools consume more… More complex tasks or
higher quality outputs may use more advanced AI models."* The user cannot predict
spend, by design.

**Publishing a complete, stable, per-model rate card is a cheap differentiator
that three of the largest players currently decline to offer.**

## Mechanisms worth knowing about

Collected because each solves a real problem and most are not widely copied.

- **Runway's fungible credit pool** (Sept 2026): *"all purchased credits available
  for use across both our web app and Runway Dev… Credit commitments are now
  fungible… Buy centrally with a single invoice."*
- **Runway's spend-based auto-tiering**: five tiers from $100 to **$100,000/30
  days**, upgrading **instantly on spend**, with **no maximum RPM at all** —
  over-concurrency work is queued as `THROTTLED` in submission order rather than
  rejected. *"You do not need to add rate-limiting logic."*
- **Luma's rejection model**, the opposite choice: *"The API does not queue excess
  requests — they are rejected immediately with HTTP 429"*, with `Retry-After`
  computed per limit type. It also **fails open** if its rate-limiting Redis is
  unavailable, on the stated principle that *"rate limiting is a fairness
  mechanism, not a security boundary."*
- **Luma's `user_id` passthrough** — *"forwarded to upstream model providers as
  their per-user tagging field, so trust & safety issues can be attributed to a
  specific end user rather than your whole account."* The cleanest B2B2C safety
  design found anywhere in this research, and directly relevant to any
  developer-facing credit system.
- **WaveSpeed's single-top-up tiering**: Bronze 5 rpm / 2 concurrent by default;
  Silver, Gold ($1,000–4,999) and Ultra (≥$5,000) set by a **single** top-up, so
  incremental top-ups don't aggregate. A deliberate prepay-forcing mechanism.
- **Estimate-then-settle billing** (Segmind, Eachlabs, Picsart). Picsart's
  pre-authorisation buffer runs **145% above actual** on some models, so a cost
  model built off the estimate overstates by ~2.5x.
- **Pre-flight cost quotes** — Picsart's SDK can quote cost before you run.
- **Time-of-day pricing** — Novita exposes an explicit `off_peak: true` flag on
  Vidu Q3, from **$0.0179/s off-peak**.
- **Krea's weights licensing as a third revenue line** — $1,000/month per model
  self-host license (10,000 images/month, 1 domain, 10 users), explicitly *"does
  not permit hosting an external-facing API endpoint with the model."*

## Refund policies, for comparison

| Platform | Policy |
| --- | --- |
| **Higgsfield** | 7 days from initial purchase, **only if zero credits used, minus a 6% service fee**; **renewals never refundable** |
| **AI/ML API** | *"AIMLAPI does **not offer refunds** for any products or services purchased through our platform"* |
| **OpenArt** | No refunds for completed generations or active periods; annual→monthly downgrade carries a **10% processing fee**; cancel ≥5 days before renewal |
| **Luma** | *"Payments… are final and non-refundable, unless otherwise determined by Luma AI"* |
| **ElevenLabs** | Prepaid credits non-refundable, final sale |
| **Picsart** | *"our subscriptions are non-refundable"* |

## Not reached

- **Pollo AI's and Freepik/Magnific's full credit tables** at per-model
  granularity.
- **Canva's integer AI allowances** are from an April 2026 help-centre snapshot
  via a third party, not a live read — Canva publishes only multipliers now.
- **Actual breakage rates.** No platform discloses what fraction of sold credits
  go unused, which is the number that would make this file conclusive rather than
  suggestive.
- **Enterprise credit terms** — committed-spend structures, rollover negotiations
  and overage pricing are sales-led everywhere and none were obtained.
