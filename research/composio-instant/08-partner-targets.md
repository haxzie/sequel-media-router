# 08 — Partner targets and resale terms

*As of 2026-11-10. **This is not legal advice.** The clauses below are what
targeted queries returned from each provider's public terms, not complete
readings of each agreement. Where a query found nothing on resale, this file says
"not found in retrieved text" — silence is never treated as permission. All of it
needs a lawyer before anyone relies on it.*

## The distinction that governs everything

Providers separate two things that casual discussion conflates. Getting this
wrong is the difference between a viable product and a terms violation.

**1. Reselling access** — handing a third party your account, API key or credits.
**Prohibited essentially everywhere on self-serve terms.**

**2. Serving your own end users through your own application** — you remain the
customer of record, your users never touch the upstream API, and you meter them
yourself. **Generally permitted, and usually has its own defined contract term**
("Customer Solution", "Customer Application", "End User").

A unified credit wallet is **shape 2, not shape 1** — provided the operator holds
the accounts and never passes upstream credentials through to developers.

## The comparison, from clauses read directly

| Provider | Resale of access | Serving own end users | Competing-product clause | Verdict |
| --- | --- | --- | --- | --- |
| **Google Cloud / Vertex** | **Formal authorized-reseller framework exists** — "Resold Services", "Reseller Order", "Reseller Agreement" are defined terms in the service terms | Yes | None found | **Cleanest route — an actual program to apply to** |
| **OpenAI** | Prohibited, incl. key transfer | **Yes — explicitly contemplated** | **Narrow:** bars only using Output to develop competing *models* | **Workable as shape 2** |
| **ElevenLabs** | **Credits non-transferable, "any purported transfer is void"** | Not addressed in retrieved text | None found in retrieved text | Needs an enterprise agreement |
| **AWS Marketplace** | Prohibited unless a listing's separate license says otherwise | Varies by listing | Per-listing | Depends entirely on each model's license |
| **fal** | Prohibited, incl. service-bureau use | Yes, via "Customer Solution" | **Broad — bars building "a similar product or competitive product"** | **Not a supply route for this product** |

### Google Cloud — the only named reseller program found

Google's service terms contain a complete reseller framework, with defined terms
for **Resold Services**, **Reseller Order** and **Reseller Agreement**, covering
how Google provisions to a customer through a reseller, who issues invoices, who
provides support, and what happens to SLA credits. Representative clause:

> *"Google will provide to Customer the Resold Services described in the Reseller
> Order to the extent that there is a valid and binding order for such Services
> between Google and Reseller."*
> — [cloud.google.com/terms/service-terms](https://cloud.google.com/terms/service-terms)

This matters because **Google is the price anchor for the entire Western video
and image market** (see [04-models-video.md](04-models-video.md)) and the single
largest publisher of volume models after Black Forest Labs. It is the one major
provider whose terms contemplate resale as a first-class arrangement rather than
an exception requiring negotiation.

### OpenAI — resale barred, applications explicitly permitted

From the [OpenAI Services Agreement](https://openai.com/policies/services-agreement/), verbatim:

> *"Customer may not resell or lease access to its Account or any End User
> Account."*

> *"End Users. End User Accounts may only be provisioned to, registered for, and
> used by, a single End User. Customer is responsible for all activities that
> occur under its Account, including the activities of End Users with an End User
> Account **or who access the Services through a Customer Application**."*

And among the prohibited uses:

> *"(e) except for a Permitted Exception, use Output to develop artificial
> intelligence models that compete with OpenAI's products and services; … (g)
> buy, sell, or transfer API keys from, to, or with a third party"*

**Two things follow.** First, the "Customer Application" serving "End Users" is an
explicitly named, permitted mode — which is the shape a credit wallet takes.
Second, the competing-use restriction is **notably narrow**: it covers training
competing *models*, not building a competing *service*. That is materially more
permissive than fal's equivalent clause.

### ElevenLabs — credits specifically, and the gap that remains

From the non-EEA [Terms of Service](https://elevenlabs.io/terms-of-use), verbatim:

> *"Prepaid Credits may not be transferred, sold, gifted, traded, sublicensed, or
> assigned, whether for value or otherwise, and any purported transfer is void."*

> *"ElevenLabs does not permit or recognize the sale, transfer, gift, trade, or
> exchange of Prepaid Credits. Any such attempt constitutes a material breach and
> may result, at ElevenLabs' discretion, in cancellation or forfeiture of Prepaid
> Credits or termination of your Account without refund."*

Also: *"ElevenLabs has no obligation to provide notice prior to the expiration of
Prepaid Credits"*, and prepaid credits are non-refundable / final sale.

So the naive construction — buy ElevenLabs credits wholesale, resell them inside
your own wallet — is expressly prohibited, with forfeiture and account
termination as the stated remedy.

**Two honest caveats.** This clause governs *credits*, not the Services
generally; the retrieved text did not surface a general anti-resale or
anti-competing-service clause, so the terms are recorded here as **silent on that
point as read**. And resale is evidently available by negotiation: a procurement
marketplace listing describes ElevenLabs Enterprise as including *"custom
licensing terms (white-labeling, resale rights, high-volume distribution)"*, and
ElevenLabs already ships first-party endpoints on fal, Runway, Luma, Magnific,
OpenArt and Picsart.

### fal — ruled out for this specific product

Because fal is the obvious shortcut (one integration, 170+ endpoints, already the
supplier to Krea, HeyGen and Lightricks), its terms were read directly. From
[fal.ai/legal/terms-of-service](https://fal.ai/legal/terms-of-service), the
customer **will not**:

> *"(xii) resell, transfer, assign, or sublicense Customer's rights under these
> Terms to any third party or use the Services on a timesharing, service bureau,
> or similar arrangement, to run an outsourcing business, or to provide the
> Services for the benefit of any third party;"*

> *"(vi) access the Services or Documentation or use the Services in order to
> develop or build a similar product or competitive product;"*

> *"Client will not expose any of the Services APIs directly to any End Users."*

But the same terms **do** grant an embedding right — fal defines "End Users" as
*"your end user customers who use the Customer Solution"* and grants the right to
*"allow End Users to access and use the Services through the Customer Solution."*

**So fal permits embedding and prohibits both reselling and building a similar or
competitive product.** A unified media API sold on a credit system is on the wrong
side of both (xii) and (vi) — it is close to a definitional competitor. Sourcing
from fal on self-serve terms is therefore not available for this product, and a
negotiated OEM agreement would require fal to knowingly supply a competitor.

**Treat fal as the pricing benchmark and the competitive reference, not a supply
route.**

### AWS Marketplace

> *"Except to the extent Content made available through AWS Marketplace is
> provided to you under a separate license that expressly states otherwise,
> neither you nor any End User may… (c) resell or sublicense the Content"*
> — [aws.amazon.com/service-terms](https://aws.amazon.com/service-terms/)

The carve-out is the important part: **per-listing licenses can and do grant
more.** Bedrock-distributed models (Stability, **Luma Ray2**, TwelveLabs, Nova)
each need their own license read.

## The evidence that distribution deals get signed

This is the most useful single fact in this file. **172 live fal endpoints were
enumerated directly on 2026-11-10.** The labs shipping **first-party, named,
namespaced endpoints** on a third-party distributor include:

**OpenAI** (`openai/gpt-image-2`, `gpt-image-2.5/*`) · **Google**
(`google/nano-banana-2.1`, `fal-ai/nano-banana-pro`, `fal-ai/lyria3`,
`fal-ai/gemini-3.1-flash-tts`) · **xAI** (`xai/grok-imagine-*`, `xai/tts/v1`) ·
**Black Forest Labs** (`blackforestlabs/flux-3*`) · **Kuaishou** (`kling/v4/*`) ·
**MiniMax** (`minimax/h3*`, ~20 endpoints) · **ByteDance**
(`bytedance/seedance-2.5/us/*`, `seed-audio-1.0`) · **Alibaba**
(`alibaba/qwen-image-3`, `wan-3.0*`) · **ElevenLabs**
(`fal-ai/elevenlabs/tts/*`, `/music`, `/sound-effects/v2`) · **Lightricks**
(`lightricks/ltx-2.5/*`) · **Krea** · **Recraft** · **Bria** · **Topaz** ·
**HeyGen** · **Sync** · **Tripo** · **Meshy** · **Tencent** · **Hyper3D** ·
**Meta** · **Decart** · **PixVerse** · **Veed** · **Inworld**.

Replicate's Official namespace adds **Runway, Luma, Stability, Ideogram,
Leonardo, Resemble, PlayHT, Vidu, Character.AI** and more — and Replicate is
explicit about the arrangement: *"Replicate maintains the official models, and we
work with the authors to make sure they're high quality."*

**Essentially every major lab — including OpenAI, Google and xAI — has already
licensed first-party endpoints to a third-party distributor.** The partner
question is not "is this possible." It is "what are the terms, and what leverage
do we have."

### Corroborating evidence of real commercial agreements

- **MiniMax is funding a discount through Replicate's channel:** *"Minimax H3 Lite
  and Highspeed are 50% until end of year"* on Replicate's own pricing page. Labs
  do not subsidise discounts in channels they have not contracted with.
- **Black Forest Labs named launch partners** for FLUX.1 Tools (2024-11-21):
  Replicate, fal, Together, Freepik and Krea.
- **Together was the exclusive launch partner for FLUX1.1 [pro]** (Oct 2024).
- **Higgsfield advertises "Day 0 access to every Kling model plus Seedance 2.5,
  WAN 2.5"** — day-zero access is not obtainable by reverse engineering.
- **fal's dated partnerships:** BFL and PlayAI (Feb 2025); Google Gemini,
  Stability, ByteDance, Kling, MiniMax (Jul 2025); **AWS** (May 2026).
- **Luma → Adobe**: Ray2 into Firefly (Apr 2025), **Ray3 with Adobe as first
  launch partner** (Sept 2025) including an exclusivity window.
- **Runway → Adobe** multi-year strategic partnership (Dec 2025), with Gen-4.5
  *"available for a limited time exclusively in Adobe Firefly"*.

## Routes to market, by provider

| Provider | First-party API | Via Vertex | Via Bedrock | Via Azure | Notes |
| --- | --- | --- | --- | --- | --- |
| **Google** (Veo, Nano Banana, Lyria, Imagen) | Yes (Gemini API) | **Yes — native** | — | — | **Has a named reseller framework.** The price anchor |
| **OpenAI** (GPT Image) | Yes | — | — | Yes | Application mode permitted; **Sora 2 withdrawn entirely** |
| **Black Forest Labs** (FLUX) | Yes (bfl.ai) | — | — | — | **dev + schnell + Klein are open weights** — self-host route exists |
| **Kuaishou** (Kling) | **Yes — broadened at the Kling 4.0 launch, Oct 2026** | — | — | — | Prepaid packs **$9.80 to $7,560**; one source puts practical access at **$700+ minimum** |
| **ByteDance** (Seedance, Seedream) | BytePlus ModelArk + LAS (2 prices) | — | — | — | **Geo-blocked from US/CA/UK/AU/NZ**; China route needs real-name verification and RMB |
| **MiniMax** | Yes | — | — | — | **H3 weights are open** — self-host route exists |
| **Alibaba** (Wan, Qwen Image) | Yes | — | — | — | **Open weights** |
| **Tencent** (Hunyuan, Hunyuan3D) | Yes | — | — | — | **Open weights** |
| **ElevenLabs** | Yes | — | — | — | Enterprise agreement required for resale |
| **Luma** | Yes (first-party models only) | — | **Yes (Ray2)** | — | **Luma's API is first-party only; its app aggregates** |
| **Runway** | Yes (Runway Dev) | — | — | — | **Also licenses its own weights for self-hosting** |
| **Topaz, Recraft, Ideogram, Bria, Lightricks, Sync, HeyGen, Tripo, Meshy, Hyper3D, Inworld, Fish Audio, PixVerse, Vidu** | Yes | — | — | — | All already distribute through fal and/or Replicate |
| **Stability** | Yes | — | **Yes** | — | |
| **Cartesia, Hume, Deepgram, PlayAI** | Yes | — | — | — | Cartesia also via Together and Baseten |
| **Midjourney** | **None** | — | — | — | **No public API at any price** |
| **Suno, Udio** | **None found** | — | — | — | **Suno is a fal customer, not a supplier** |
| **Moonvalley (Marey)** | Yes | — | — | — | Licensed-data positioning; in Adobe Firefly |
| **fal** | Yes | — | — | — | **ToS bars resale and competing products** |

## Priority ranking for outreach

Ordered by the combination of evidenced volume, terms permissiveness and route
clarity. This is a ranking of *feasibility*, not a recommendation to pursue.

**Tier 1 — clear route, high volume, terms contemplate it**
1. **Google** — named reseller framework, the price anchor, #2 publisher by volume
2. **Black Forest Labs** — 37% of measured volume; open dev weights mean a
   self-host fallback exists if terms fail
3. **OpenAI** — application mode explicitly permitted; narrow competing-use clause

**Tier 2 — open weights, so terms are less of a gate**
4. **Alibaba** (Wan, Qwen Image), **Tencent** (Hunyuan), **MiniMax** (H3) — open
   weights change the question from licensing to inference engineering
5. **Pruna AI** — the third-largest publisher by volume on Replicate; a distilled-
   model supplier rather than a lab, and cheaper to partner with

**Tier 3 — closed but demonstrably willing to distribute**
6. **ElevenLabs** — enterprise agreement needed; already on six aggregators
7. **Kuaishou / Kling** — has its own API now and is disintermediating, but
   minimum commitments are high enough that a distributor still has a role
8. **Topaz, Recraft, Ideogram, Bria, Lightricks, Sync, Tripo, Meshy, Inworld** —
   smaller labs, already distributing everywhere, likely the easiest "yes"
9. **Runway, Luma** — both distribute and both license weights

**Tier 4 — structurally hard**
10. **ByteDance** — the geo-restriction is both the reason a reseller tier exists
    and a compliance problem (see [11-legal-compliance.md](11-legal-compliance.md))
11. **Midjourney, Suno, Udio** — no API exists; any product claiming one is built
    on reverse-engineered endpoints
12. **fal** — competitive-product clause

## The leverage question

Every provider above has signed distribution deals, so terms are negotiable in
principle. What a new entrant brings to that negotiation is **not spend** — it
would be starting from zero against fal's $800M of annualised volume.

What Composio demonstrably has instead: **200,000+ developers, ~300M tool calls
per month and 1B+ cumulative, 850+ existing toolkits, an established MCP gateway,
and SOC 2 Type II + ISO 27001.** Whether distribution-reach-without-spend is
currency a model lab will accept is the open commercial question, and this
research cannot answer it.

## Not reached

This is the least complete file in the dossier and the gaps are material.

- **Resale clauses for ~30 of the providers listed** were not read. Only Google
  Cloud, OpenAI, ElevenLabs, AWS Marketplace and fal were verified directly.
  Specifically unread: Black Forest Labs, Kuaishou, ByteDance/BytePlus, MiniMax,
  Alibaba, Tencent, Runway, Luma, Ideogram, Recraft, Topaz, Stability, Cartesia,
  Hume, Deepgram, PlayAI, Fish Audio, Bria, Moonvalley, Lightricks, Sync, Hedra,
  HeyGen, Tripo, Meshy, Resemble, Camb.ai, Azure AI Foundry.
- **Named BD contact surfaces** — partner pages, partnerships@ addresses, program
  URLs — were not systematically collected for any provider.
- **Published volume / committed-use discount tiers.** No provider's wholesale
  rate card was obtained. Everything in [09-economics.md](09-economics.md) about
  wholesale discounts is inferred from observed retail spreads.
- **Whether any provider offers a formal partner program besides Google** — e.g.
  an ElevenLabs reseller tier, a BFL distribution program.
- **Midjourney's and Suno's ToS language and enforcement record** against
  unofficial resellers.
