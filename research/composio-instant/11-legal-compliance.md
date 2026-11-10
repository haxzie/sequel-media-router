# 11 — Legal and compliance landscape

*As of 2026-11-10. **Not legal advice.** Quoted clauses are what targeted queries
returned, not complete readings. Where a query found nothing, this file says so
rather than inferring. Everything here needs a lawyer before anyone relies on it.*

## The thesis: in this market, the contract is the product

Every aggregator resells roughly the same shelf at roughly the same price (see
[09-economics.md](09-economics.md)). Catalog size is table stakes — Replicate
50,000 models, WaveSpeed 1,000+, Eachlabs 655, Segmind 552, AI/ML API 399.

What is **not** commoditised is the contract. And the gap between the best and
worst offering here is enormous.

## Indemnification — the benchmark and the field

**Runway Dev's enterprise terms are the benchmark, and nobody matches them:**

- **One agreement covering every model, including other labs'**
- **No training on your data**, extended across third-party models
- **Uncapped IP indemnification sitting outside the liability cap, covering other
  labs' models**
- **Zero data retention** with custom deletion windows
- SOC 2 Type II + ISO/IEC 27001; DPA with 48-hour breach notice
- Public subprocessor list with 15-day objection window
- **Every model provider passes Runway's own vendor-management program**
- **Tunable moderation** on Runway and select third-party models

Against that:

| Provider | Indemnity posture |
| --- | --- |
| **Runway** | **Uncapped, outside the liability cap, covers third-party models** |
| **Adobe** | Firefly indemnity is real, but **explicitly does not extend to partner models** (Veo, Runway, Luma, Flux, Topaz, Moonvalley, Pika, ElevenLabs inside Firefly) |
| **Canva** | AI-output indemnity is **Enterprise-only at a 100-seat minimum** |
| **Picsart** | Sells indemnity as a product — its PAIR lab built a model **trained exclusively on Getty's licensed creative content**, giving users full commercial rights and indemnity, under a **recurring (not one-time-fee)** arrangement |
| **Bria** | Licensed-data positioning; the compliance-safe generation option on fal |
| **Moonvalley (Marey)** | Licensed-data positioning |
| **fal** | **No disclosed enterprise indemnification found** |
| **Replicate, Together, Novita, Segmind, WaveSpeed, Eachlabs, AI/ML API** | **None found** |

**No aggregator examined besides Runway publishes enterprise indemnification for
generated-output copyright claims** — while active litigation concerns exactly
the model classes they host.

## Active litigation

- **Disney, NBCUniversal and DreamWorks v. Midjourney** (June 2025) and **Warner
  Bros. Discovery v. Midjourney** (September 2025). Midjourney is arguing fair
  use; still in discovery as of July 2026.
- The exposure lands on **the serving layer**, not only the model trainer — which
  is the structural reason indemnity matters for an aggregator specifically.

## Provenance and watermarking

Partially researched. What was verified:

- **fal operates a public content-verification surface** (`fal.ai/verify`) and a
  content-reporting page (`fal.ai/report-content`).
- **Google's SynthID** applies across its generative media outputs.
- **Sora watermarking** was a documented feature before the API's withdrawal.

**Not verified:** whether C2PA signing is preserved through any aggregator's
pipeline, which providers contractually require downstream watermark retention,
and whether stripping provenance metadata breaches any provider's terms. **This
is a material gap** — for an API that re-encodes or proxies assets, provenance
preservation is both a contractual and a regulatory question.

## Moderation obligations

Two patterns, and they are in tension:

**Mandatory and non-tunable.** fal applies moderation with no opt-out — users
report being blocked generating benign content (a sleeveless dress) on Wan 2.7.
Canva's Shield is mandatory. OpenArt **hard-blocks NSFW**. This pushes
NSFW-adjacent but legitimate work toward self-hosting or gray resellers.

**Developer-tunable.** Picsart exposes **per-request `options.safety_checks.enabled`**
(defaults true). Runway offers **tunable moderation** on its own and select
third-party models at enterprise tier.

The operational hazard sits between them: **WaveSpeed has a verbatim user report
of being charged for moderation-blocked generations despite a stated
no-charge-on-failure policy.** Moderation that bills is a refund dispute waiting
to happen.

## Geographic restrictions — the most concrete compliance issue found

**ByteDance's official Seedance route is not sold in the US, Canada, UK,
Australia or New Zealand.** BytePlus publishes an allowlist of roughly 40 markets
(EEA, Japan, Korea, Singapore, Gulf, SEA). The China route — Volcano Engine Ark —
requires **real-name verification and RMB payment**.

This produces three distinct problems:

1. **It is why the reseller tier exists.** Western teams cannot buy the official
   door at the official price, so a margin-bearing intermediary appears. See
   [09-economics.md](09-economics.md).
2. **Buying through an allowlisted entity to serve a blocked market is a terms
   question** that no public source resolves.
3. **Data residency breaks silently.** Atlas Cloud reportedly routes some requests
   through BytePlus, which changes where data goes without the caller knowing.

Related disclosures worth recording: **Higgsfield's privacy policy discloses
vendor data flows to the US, EU, UK, China and Kazakhstan.** **Novita publishes no
data-residency or region-pinning** despite a PRC-lab-dominated catalog, and
documents a **`NEED_REAL_NAME_VERIFY` identity gate** on some models.

## Training on user data

| Provider | Default |
| --- | --- |
| **Runway** | **No training on your data**, extended across third-party models, at enterprise |
| **Luma** | **No-train guarantee on every plan** (API ToU §10) |
| **OpenArt** | **No training on user content** |
| **Higgsfield** | **Default opt-in to training on user inputs.** After a July 2025 backlash the terms were revised, but the opt-in language remained word-for-word. **Only enterprise customers get a contractual no-training guarantee** |
| **ElevenLabs** | The ToS grants a **perpetual, irrevocable, royalty-free, worldwide, sub-licensable-through-multiple-tiers** license over user Content — explicitly including voice — *"to provide and improve the Services, and to develop new services and products."* It commits not to *"commercialize your voice on a standalone basis without your permission"* |
| **Google** | Paid tier: **not used to improve products**. Free tier: **yes, used** |

The free-vs-paid distinction on Google's tiers is worth flagging to anyone
prototyping — the default on a free key is that your data trains the model.

## Data retention

- **Higgsfield** ships an `Hf-Expires-After` header with **per-request data
  deletion** at enterprise tier — the most granular control found.
- **Runway** offers zero data retention with custom deletion windows.
- **Baseten does not store async outputs**: *"if all webhook delivery attempts
  fail, you can't retrieve the output."* For expensive video jobs that is a real
  operational risk, not just a compliance note.
- **fal** has a documented user report that uploads persist after deletion — *"PSA:
  fal.ai NEVER deleted what you upload — once you delete it from the website it's
  gone… unless you save the link"* (r/StableDiffusion). **Enterprise-blocking if
  surfaced in a security review.**

## Compliance certifications across the field

| Provider | Posture |
| --- | --- |
| **Composio** (for reference) | **SOC 2 Type II + ISO 27001** |
| **Runway** | SOC 2 Type II + ISO/IEC 27001, DPA, subprocessor list |
| **Novita** | SOC 2 Type II, but **no HIPAA, no VPC peering**, Discord-only support, 99.5% SLA on dedicated only |
| **WaveSpeedAI** | **No SOC 2, ISO or data-residency disclosure found** — a hard blocker for regulated Western enterprise |
| **AI/ML API** | **Encryption in transit and at rest is Enterprise-only**; fair-use policy reserves undefined discretionary throttling |
| **Replicate** | Sacra's note: *"many larger SaaS, fintech, and healthcare companies require governance features that the platform does not currently offer"* |
| **Canva** | **Data residency is Enterprise/Campus/District only** |

## Transparency about what you are actually served

A distinct and under-appreciated risk class, documented in
[02-competitors.md](02-competitors.md):

- **Model substitution.** A Trustpilot reviewer alleges AI/ML API sold "GPT-5"
  access while serving GPT-4; **the company's reply does not deny routing**.
  Independent reviewers now run "model-substitution checks" and "direct-connect
  status" audits across 140+ API relay providers.
- **Upscale sold as native resolution.** Reseller "1440p" and "4K" tiers on
  Seedance 2.5 were super-resolution upscales — ByteDance only announced native 4K
  on 2026-10-23, for selected enterprise customers.
- **Unexplained below-list pricing.** WaveSpeed's Claude Opus 5.5 at Anthropic's
  *batch* rate on a standard endpoint; AI/ML API's Veo 3.1 at half Google's list;
  Segmind's Seedance at half BytePlus's. Each implies either a negotiated rate, a
  distilled substitute under the brand name, batch routing sold as standard, or
  unauthorized supply.

**For a unified API, "which model actually served this request" is both a
contractual commitment and a product feature.** Runway's Media Router already
treats it as one: *"the response metadata report[ing] the model used and the
realized cost in credits."*

## Reverse-engineered endpoints

**Midjourney and Suno have no public API at all.** Any product advertising a
"Midjourney API" or "Suno API" is therefore, by construction, built on
reverse-engineered web/Discord endpoints and pooled accounts — a terms violation
with account-termination risk passed silently to the buyer. Several products in
the budget-reseller tier are known primarily for exactly this.

**This needs primary verification before being relied on.** Midjourney's and
Suno's current ToS language and any enforcement record were **not** reached in
this research. The inference above follows from the absence of a public API, not
from a reading of their terms.

## Consumer-protection exposure

The prosumer tier has accumulated real regulatory surface, which matters if
Composio Instant ever develops a self-serve consumer motion:

- **BBB complaints on file** against both **Higgsfield** and **OpenArt**.
- **Forbes, Feb 2026:** *"Racist videos and payment problems: the dark side of
  this AI startup's super-fast growth"* (Higgsfield).
- A dedicated gripe site exists for Higgsfield.
- **OpenArt ships an "AI Celebrity Generator" and "AI Character Swap"** —
  likeness-rights exposure, awkward beside its Disney Accelerator placement.
- **Cancellation friction** is the recurring complaint at Picsart, Higgsfield and
  Leonardo, including a Leonardo enterprise customer reporting *"no working path
  to stop being billed."*

## Not reached

This file has the largest verified-coverage gap in the dossier.

- **C2PA / SynthID contractual requirements.** Whether providers require
  downstream watermark retention, whether provenance survives an aggregator's
  pipeline, and what stripping it implies — none verified.
- **EU AI Act obligations** for a provider of generative media services, including
  transparency labelling duties. Not researched at all.
- **Per-model commercial-use and resale licensing** — the provider level is in
  [08-partner-targets.md](08-partner-targets.md), but individual model licenses
  (especially open-weight ones, which vary from Apache to non-commercial) were not
  read.
- **Midjourney's and Suno's actual ToS language and enforcement history.**
- **Whether any provider contractually requires moderation to be applied by the
  reseller**, which would constrain a tunable-moderation feature.
- **Output ownership and copyright assignment** terms, which differ by provider
  and matter for enterprise buyers.
- **US procurement restrictions on Chinese-origin models** — frequently discussed
  in the market, not verified here.
