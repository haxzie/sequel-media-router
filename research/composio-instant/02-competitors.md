# 02 — Competitor dossiers

*As of 2026-11-10. **[REPORTED]** = company disclosure, SEC filing, or named
primary/press source. **[ESTIMATE]** = third-party tracker or our arithmetic.*

## Summary table

| Company | Revenue | Valuation | Raised | Staff | Buyer | Media posture |
| --- | --- | --- | --- | --- | --- | --- |
| **fal** | **$800M+** annualized (Sep 2026) [REPORTED] | **$16B** (2026-11-03) | **$1.65B+** | ~80 | Devs + 300 enterprise | **Category leader** |
| **Higgsfield** | **$1B+** run-rate (Sep 2026) [REPORTED, see caveat] | $5.4B (Aug 2026) | $538M | — | Agencies, brands, studios | Lab + aggregator |
| **ElevenLabs** | $600M ARR (Sep 2026) [REPORTED] | $22B (Oct 2026) | — | — | 55% large orgs | Audio lab |
| **Fireworks AI** | $1B+ (Jul 2026) [REPORTED] | $17.5B (talks $30–40B) | $1.6–1.8B | ~200–260 | LLM devs | **Exited media 2026-06-10** |
| **Modal** | $1B+ (Oct 2026) [REPORTED] | $15.75B | ~$1.22B | 200+ | Builders | Substrate (Runway, Suno) |
| **Together AI** | $1B annualized (Feb 2026) [ESTIMATE] | $8.3B | ~$1.33B | 445 | LLM-first | Direct competitor, ~0% margin |
| **Baseten** | ~$600M annualized (Mar 2026) [ESTIMATE] | $11–13B | ~$2.1B | — | Perf-sensitive | Open weights only |
| **Runway** | **$200M ARR** (Sep 2026) [REPORTED] | $5.3B (Feb 2026) | ~$860M | 350–580 | Studios, agencies | Lab + aggregator + router |
| **Magnific** (ex-Freepik) | **$230M ARR** (Apr 2026) [REPORTED] | n/a | **no VC** (but see caveat) | ~400 | Creators, SMB, enterprise | Pure aggregator |
| **OpenArt** | **~$200M ARR** [REPORTED, PR] / $70M+ floor | undisclosed | **$35M** | ~20 | Creators | Pure aggregator, **no API** |
| **Luma** | ~$80M annualized [ESTIMATE] | $4B+ | >$1B | 250–356 | Agencies, enterprise | Lab; app aggregates, API doesn't |
| **Canva** | **$4.0B ARR** (end-2025) [REPORTED] | ~$30.4B (marked down from $42B) | ~$580M | — | 265M MAU / 31M paid | Bundler → building own models |
| **Picsart** | ~$158M [ESTIMATE] | $1.5B (stale since 2021) | $195M | 1,374 | 100M+ creators | Bundler → open gateway |
| **Krea** | ~$8M (2025) [ESTIMATE] | $500M | $83M | ~53 | Creators + devs | Lab + aggregator + weights licensing |
| **Leonardo** (Canva) | — | acq. **≥A$320M (~US$205M)** | — | — | Creators | Lab inside a bundler |
| **Replicate** | ~$3–6M ARR [ESTIMATE] | **sold $57.4M** | $58M | 37 | Indie devs | **Acquired, absorbed** |
| **OpenRouter** | ~$160M annualized [ESTIMATE] | **Stripe, >$7B** | >$150M | — | Devs | Text router; the model to benchmark |
| **Eachlabs** | $1.5M ARR (Sep 2025) [REPORTED] | — | ~$1.8M | ~21 | App studios | Aggregator + 85 own SKUs |
| **Novita** | ~$1.1M ARR [ESTIMATE, stale] | — | **$0, unfunded** | ~23 | LLM devs | Media a generation behind |
| **Segmind** | <$1.2M (IN entity) [REPORTED] | — | ~$1.0M | **7** | Devs + creators | 552 models, below-list pricing |
| **WaveSpeedAI** | **not found** | — | angel, undisclosed | 18 | Devs | **Media-native, 552 video SKUs** |

---

## fal (features and labels, Inc.) — the one to beat

### Trajectory [REPORTED]

| Date | Milestone |
| --- | --- |
| Sep 2024 | $10M ARR, 500K devs, 50M generations/day |
| Jan 2025 | $3.6M MRR (~$40M run-rate), **no sales team** |
| Jul 2025 | **$95M ARR**, 2M devs, 300 enterprise; $125M Series C at **$1.5B** |
| Oct 2025 | **$200M annualized**; team 30→70 |
| Dec 2025 | $140M Series D led by **Sequoia** at **$4.5B** |
| Mar 2026 | **~$400M annualized** — 40x in 18 months |
| Aug 2026 | **2.5M developers**; headcount ~80 |
| **Nov 2026** | **$1.3B at $16B**, Bessemer-led (Nvidia, Sound Ventures, T. Rowe); **$800M+ annualized** |

~**20x** annualized at the November round, up from ~11x at the Series D. That is
now the **highest multiple of the entire inference cohort** (Fireworks ~17.5x,
Modal ~15.75x), justified only by media specialisation.

### How it makes money

- **Model APIs** billed per output unit: video per second or per video, images per
  image or per megapixel, audio per 1,000 characters or per second, 3D per unit.
- **Serverless compute** per GPU-hour, list vs floor: **B300 $12.99 → $5.99**,
  GB200 $9.99 → $5.89, B200 $7.99 → $5.49, H200 $6.00 → $2.99, **H100 $4.50 →
  $2.49**, RTX PRO 6000 $4.00 → $1.99. The list-to-floor spread *is* the
  volume-commitment negotiation surface.
- **fal Agent** (Aug 2026) — its first recurring revenue: Starter $50/mo, Pro
  $200/mo (−5% usage), Max $1,000/mo (−10%). **Credits roll over.**

### Two structural advantages

**1. It post-trains partner models into fal-exclusive SKUs.** "FLUX 3 Max,
post-trained by fal". "H3 Max — a post-trained variant of MiniMax H3,
co-optimized with our custom inference stack", claimed at **~35x the throughput
of MiniMax's own endpoint** and sold at **$0.03/s**. fal co-develops a SKU the
originating lab does not sell elsewhere. This is the margin-bearing move and the
hardest thing to copy, because it needs engine-level engineering rather than BD.

**2. It is the wholesale supplier to companies that look like competitors.** Its
own pricing page names **Canva, Adobe, Autodesk, Shopify, Suno, Quora, World
Labs, Krea, HeyGen and Lightricks** as customers.

### Weaknesses, sourced

- **Billing for failed calls** — the most damaging recurring complaint for an
  infra vendor. r/n8n: *"one error after the other and also charged on every
  failed call"*.
- **Account/balance bugs:** "Account locked despite $20 balance"; repeated "card
  declined" on top-ups (r/FalAI).
- **Data retention:** *"PSA: fal.ai NEVER deleted what you upload — once you
  delete it from the website it's gone… unless you save the link"*
  (r/StableDiffusion). Serious for enterprise diligence.
- **Moderation with no opt-out** — users report being blocked generating benign
  content (a sleeveless dress) on Wan 2.7.
- **Most expensive mainstream door for Seedance 2.5** (+105% over BytePlus,
  roughly double Replicate at 720p).
- **No disclosed enterprise indemnification**, while Midjourney litigation
  concerns exactly the hosted model classes.
- Nvidia-only silicon; $337.5M raised through Sep 2026 was less than a quarter of
  what Fireworks or Baseten raised in a single 2026 round — though the $1.3B
  November round largely closes that gap.

---

## Higgsfield — $0 to $1B run-rate in 18 months

### Trajectory [REPORTED]

$11M (Jun 2025) → $50M (Sep 2025, **cash-flow positive**) → $100M (Dec 2025) →
**~$200M** (Jan 2026, $80M at >$1.3B) → $300M (Feb 2026, **~70% of revenue from
agencies**) → $500M (Jun 2026, 60 engineers) → **$700M** (Aug 2026, $400M Series
B at **$5.4B**, DST-led) → **$1B+** (Sep 2026).

At $1B: **32M users across 238 countries, ~1M paying subscribers, 390 of the
Fortune 500**, B2B contracted revenue up **10x since June**, cash-flow breakeven.
$538M raised total. HQ San Francisco, large engineering hub in Almaty.

**Caveat the company itself states:** $1B is **last four weeks × 13**, not
trailing revenue.

### The disclosure that matters most in this sector

> Subscriptions once accounted for **more than 90%** of Higgsfield's revenue and
> now account for **just over 60%**, while on-demand usage has expanded.

The category's centre of gravity is moving from seats to metered usage — which
favours whoever owns the per-call billing relationship. That is precisely the
asset Stripe paid >$7B for.

### Pricing

**PLUS** $49/mo ($39 annual) → 1,000 credits. **ULTRA** $129/mo ($99 annual) →
3,000 credits, sliders to 9,000. Also observed: Starter $15/200, $19/270, Plus
$59/1,200 — **at least four concurrent price lists by cohort/region**, which is
deliberate price discrimination and the root of much complaint volume.

Credit value $0.049 (PLUS monthly) to $0.039 (annual). **Auto-refill top-ups are
the worst rate at $0.0556/credit.**

**Higgsfield API** is a separate product with a separate dollar balance, no
subscription, $5 minimum, funds expiring after a year. Published rates: Soul 2
**$0.0032/image**, **Kling 2.5 $0.042/s**, **Kling 3.0 $0.112/s**, Seedance 2.5
$0.0738/s, MiniMax H3 $0.13/s, Wan 3.0 $0.20/s. 50+ models. Concurrency scales
with money funded in the last 28 days: 2 below $25, 10 from $25, 20 from $100,
40 from $1,000.

### Weaknesses — the most serious in the sector

- **Terms:** refunds only within **7 days of initial purchase, only if zero
  credits used, minus a 6% service fee**; renewals never refundable; subscription
  credits **do not roll over**; add-on credits expire in 90 days; arbitration plus
  class-action waiver.
- **Cancellation friction** with documented cases (731 credits deducted after
  cancellation, refunded only after public complaint).
- **"Unlimited" is not unlimited** — separate slower queue, throttling rights
  reserved. *"they advertised Unlimited access to certain generators and it's a
  lie"* (r/generativeAI).
- **BBB complaints on file**; a dedicated gripe site; **Forbes, Feb 2026:
  "Racist videos and payment problems: the dark side of this AI startup's
  super-fast growth."**
- **Data:** default opt-in to training on user inputs for non-enterprise;
  disclosed vendor data flows to the US, EU, UK, **China and Kazakhstan**.
- Counterweight: multiple 2026 threads argue the "scam" label is stale, and
  support grew from 2 to 40+ people.

---

## Runway — the most complete aggregator product

**$200M ARR Sept 2026, guided to $450M by end-2026** (co-CEO Anastasis
Germanidis, Bloomberg Tech, Nov 3). $5.3B valuation (Series E $315M, Feb 2026,
General Atlantic-led with **NVIDIA, Adobe, AMD Ventures, Fidelity, Premji**).
~$860M raised. 60M+ creators. **[REPORTED]**

### It resells 19 other labs

Google, ByteDance, Kuaishou, OpenAI (including **GPT-6**), BFL, xAI, Alibaba,
MiniMax, Lightricks, ElevenLabs, Ideogram, Magnific, Topaz, Recraft, Bria, Tripo,
Fish Audio, Sync, **Anthropic**, and **Krea**. Its own models: Gen-4.5 (top of
the text-to-video leaderboard at 1,247 Elo), Aleph 2.0, Act-Two, Characters,
Ruby, GWM-1, Solaris.

**Media Router** (launched 2026-07-23) routes across its own and third-party
models selecting by **cost, latency, or quality**, with *"the response metadata
report[ing] the model used and the realized cost in credits"*. It also **licenses
its own weights out** for self-hosting, and has done so with Getty and Lionsgate.

### Enterprise book — the densest in the category

Lionsgate (Sept 2024, plus an **equity stake taken in Runway** June 2026), AMC
Networks, Netflix and Disney reported as users, **Adobe multi-year strategic
partnership** (Dec 2025 — "Adobe will be Runway's preferred API creativity
partner"), BBC Studios (world-first live AI avatar on broadcast TV), Havas, EA.

Its July 2026 AI Media Report is the best public disclosure of enterprise
consumption anywhere: production costs falling **two to three orders of
magnitude**; a first AI campaign that **cost $3K–4K and aired on NFL Sundays**; a
UK broadcaster's **5-person team producing 800–1,000 ads/year, saving 46,000
hours**; a travel platform generating **~8,000 property videos via the API**; an
agency holding company at **5,000 DAU across 35,000+ employees**; **a AAA game
publisher consuming 326,000 credits in one month (~$3,260) to produce 50% of all
marketing for its flagship shooter franchise.**

Derived enterprise minimum commitment: **~936,000 credits ≈ $9,360**; an "Applied
AI Architect day" backs out at **~$5,950** [ESTIMATE].

### The enterprise contract is the benchmark

**One agreement covering every model including other labs'; no training on your
data across all models; uncapped IP indemnification sitting outside the liability
cap and covering third-party models; zero data retention with custom deletion
windows; SOC 2 Type II + ISO 27001; every provider vetted through Runway's vendor
management; tunable moderation.** Nobody else matches this — see
[11-legal-compliance.md](11-legal-compliance.md).

### Weaknesses

- **Trustpilot 1.1/5 on 393 reviews — the worst in this dossier.** Trustpilot's
  own summary: *"high subscription costs, rapid depletion of credits, and poor
  video output quality filled with errors."*
- **No webhooks — polling only.** A real gap against Krea and Leonardo.
- **Charging for unusable output.** From its own subreddit: *"Discourage
  experimentation: Artists may hesitate to try new techniques or models, fearing
  the waste of credits if the output is unusable."*
- Credits don't roll over on Standard/Pro; **1,000-credit minimum top-up**.
- **Surcharge dimensions buried in the rate card:** Seedance 2.5 1080p bills 68
  cr/s of output *plus* 34 cr/s of input/reference with an 80-credit minimum;
  ProRes/PNG +5 cr/s; HDR +20 to +40 cr/s.
- **Lionsgate custom model reportedly stalled** on data sufficiency (The Wrap).

---

## Magnific (ex-Freepik) — $230M ARR, half of it resold video

Rebranded 2026-04-28, taking the name of the upscaler it acquired in 2024.
**$230M ARR with ~half from AI video** — meaning **~$115M/year of revenue resold
from third-party video labs**. 1M+ paying subscribers, 100M monthly visits,
250–290+ enterprise teams (BBC, Puma, Coca-Cola, Ogilvy, R/GA, Amazon Prime
Video's *House of David*), 4M+ images/day. **Profitable.** Headcount **~400, down
from ~550** — the explicit cost of the pivot. **[REPORTED]**

**Material correction to flag:** Fortune and the company say Magnific *"has been
bootstrapped the entire time… never raised money from outside investors."* The
record says otherwise — **EQT Mid Market Europe acquired a majority stake in 2020
at a ~$250M valuation**, with Atwater Capital and Eurazeo also on the register.
The accurate statement is **"no venture capital," not "no outside investors."**

A pure aggregator by design: *"Rather than training its own frontier models, it
gives subscribers access to third-party models."* Dealroom's note on the
weakness: *"its model-agnostic strategy means it depends on third-party providers
for its core generative capabilities."* The CEO concedes the advantage is *"not a
superior model… but a unified workflow platform."*

**Developer-surface maturity is low** — an independent API scorecard gives
Magnific **7.2/100 ("minimal"), agent readiness 0 ("human-only")**, failing on
machine-readable contract, idempotency, rate-limit signalling and typed events.

---

## OpenArt — ~$200M ARR with no public API at all

> **"Is there API access?" — "No public API is available currently."**
> — [openart.ai/help](https://openart.ai/help/)

$1M (end-2023) → $10.5M (end-2024) → **$70M+ (end-2025, confirmed by lead
investor Canaan)** → $100M (Jun 2026, Sacra) → **"nears $200M ARR"** (company PR,
~Oct/Nov 2026). **8M MAU, ~20 people, ~$3.5M ARR per employee, profitable at the
Jan 2026 Series A.** Total raised **$35M** — against Higgsfield's $538M.
Selected for the **Disney Accelerator 2026** cohort. GTM is entirely programmatic
SEO. **[REPORTED, with the $200M figure flagged as PR against a $70M+ floor]**

100% licensed models, **zero first-party** — the exact concentration risk Canva
spent $11B of valuation learning about. Its own blog gives the game away: listing
competitors' proprietary models (*"Recraft V4, Krea 2, Luma Ray, and Leonardo
Phoenix"*) it names none of its own.

**It tunes its per-model take rate as a merchandising lever** — the most
interesting mechanic found anywhere. Live now: GPT Image 2.6 −30%, Recraft V4.1
−30%, Seedream 5.5 −50%, Kling 4.0 −50%. Its help centre explains why: *"Credit
costs for individual models are tied to the underlying costs from our AI model
providers… When that happens, we pass through the change as transparently as
possible."*

Instead of an API it ships **MCP + CLI priced as a subscription feature** with a
10% discount on Plus+, drawing on the user's own credit balance.

**The strategic implication is the most directly relevant finding in this
dossier: OpenArt built a ~$200M-ARR business with zero developer surface, and the
developer side of the prosumer tier is completely uncontested.**

Weaknesses: Trustpilot 3.5/5 (~1,716 reviews), replies to only 56% of negatives.
Credit burn dominates complaints — *"A simple 15-second TikTok video costs 3,000
credits"* (= 75% of the entire $14 plan in one video). Four separate r/generativeAI
threads use the word "scam". Failed generations still cost credits despite stated
policy. **Ships an "AI Celebrity Generator" and "AI Character Swap"** — awkward
beside a Disney Accelerator placement.

---

## Replicate — acquired and absorbed

**$57.4M all-cash, closed 2025-12-01** (Cloudflare 10-K). ~$58M raised, $350M
last valuation ⇒ **0.16x**. 50,000+ models. 37 staff. **[REPORTED]**

Evidence it has been absorbed rather than grown:
- Founder **Ben Firshman**: Replicate CEO → Cloudflare Head of AI Platform (Dec
  2025) → **Anthropic (Apr 2026)**. Four months post-close.
- The public changelog ran 5–10 entries/month through 2025 and has **zero entries
  from 2026-04-21 to today — seven months of silence.**
- Cloudflare's own Apr 2026 post: the teams are merged *"so much so that we don't
  even consider ourselves separate teams anymore,"* and AI Gateway access to
  Replicate models was still *"soon."*
- But the **catalog is still shipping** — blog posts dated 2026-11-03, and
  `kwaivgi/kling-v4-flash` versioned 2026-11-09. BD and model-ops continue;
  platform engineering has been merged away.

**Its unique asset for this research is public run counts** — see
[07-volume-concentration.md](07-volume-concentration.md).

Pricing is the aggressive end: Seedance 2.5 at **exactly BytePlus's rate (0%
markup, ~half fal)**; Veo 3.1 at Google's list; FLUX 3 **identical to BFL to
three decimals in all five resolution tiers**. Weak spot: reference-video billing
at **$0.9676 per counted second at 720p** vs fal's $0.2838 — a 10s edit of a 10s
source costs ~$9.68 on Replicate vs ~$3.58 on EvoLink.

Complaints: **cold starts** (10–60s vs fal's sub-2s on warm models; Replicate's
own blog says *"can be as slow as a few minutes for large models"* — but it
**doesn't bill boot time on public models**). **Cog is actively disliked** — top
HN comment on the acquisition: *"I quickly realized Cog was an obstacle rather
than an accelerator… If you aren't afraid of a Dockerfile, the 'ease of use'
premium evaporates."*

---

## The sub-$10M tier — Segmind, Eachlabs, Novita, WaveSpeed, AI/ML API

Four to five companies running 400–1,000-model catalogs on 7–23 employees and
≤$2M of capital. Documented patterns:

**Below-list pricing, openly advertised.** Segmind's own blog: *"Seedance 2.0 Fast
is now **$2.80 per million tokens on Segmind. BytePlus, who make the model, list
it at $5.60.** That is exactly half."* AI/ML API sells **Veo 3.1 at $0.20/s
against Google's $0.40/s**. WaveSpeed lists **Claude Opus 5.5 at Anthropic's
*batch* rate on a standard endpoint**. None is achievable on authorized-reseller
economics — see [08-partner-targets.md](08-partner-targets.md).

**Price volatility as the tell.** Segmind's Seedance 2.5 rate moved **$6.56 →
$11.263/M tokens in under a month (+72%)** — the signature of a cheap upstream
route being repriced.

**The "0% markup" claim decoded.** AI/ML API's homepage claims *"Zero markup on
any request."* Its own price table shows strikethrough list → sale, during a
Halloween promotion **ending 2026-11-10**. Claude Opus 4.1 list ~~$19.5/$97.5~~ →
sale $15/$75 against Anthropic's own $15/$75. **The standing markup is exactly
1.30x; the 0% claim is only true during a sale that ends today.**

**Model substitution is a live allegation.** Trustpilot, 2025-10-29: *"I paid
AIMLAPI.com for access to 'GPT-5'… it turned out they only provide GPT-4 while
falsely advertising it as GPT-5."* **The company's reply does not deny routing.**
Independent reviewers now run "model-substitution checks" across 140+ API relay
providers.

**Compliance is the undefended ground.** **WaveSpeed: no SOC 2, ISO or
data-residency disclosure found.** Novita: SOC 2 Type II but no HIPAA, no VPC
peering, Discord-only support. AI/ML API: encryption at rest Enterprise-only, and
a **"no refunds under any circumstances"** policy. Segmind: 5-business-day
support at the $39 tier.

**Trustpilot across the tier runs 2.3–3.5/5** with one shared complaint:
**credits consumed on failed or moderation-blocked generations, refunds refused,
support unreachable.** WaveSpeed has a verbatim report of being charged for
moderation-blocked generations *despite a stated no-charge-on-failure policy*;
AI/ML API admitted publicly it *"did have issues related to billing display and
reporting."*

**Unverified claim to treat with care:** Eachlabs' CEO claims *"exclusive
partnerships"* with MiniMax, Luma, Runway, Alibaba Wan, ByteDance and Kling
(2025-09-04). **No corresponding announcement from any of those six labs was
found.**

---

## Canva — the cautionary tale on bundling frontier video

**$4.0B ARR end-2025 (from $3.0B), ~35% YoY. 265M+ MAU, 31M+ paid.** Then:
**FY2026 growth guidance cut 30% → 20%, explicitly attributed to "unexpectedly
heavy AI use [that] drove up costs."** Three institutional markdowns in one year
($42B → $34.9B → $31B 409A → ~$30.4B implied). **1,271 roles cut, changed or
relocated (22%) on 2026-11-04.** Remote-first abandoned. IPO slipped to 2027.
**[REPORTED]**

Melanie Perkins: *"our growth has slowed for the first time in a decade… This has
been our hardest year yet… we need to refound Canva."*

**Why, in one calculation:** Canva Pro is **$12.00/mo including up to 20 Veo 3
"Ultra" clips ⇒ ~$0.60 of implied revenue per clip against $3.20–6.00 of
wholesale cost — a 5x to 10x negative gross margin at full utilisation**
[ESTIMATE]. AI Pass at ~$100/mo for ~800 Ultra clips implies **~$2,560 of COGS
against $100 of revenue**. These are insurance products priced on low-single-digit
utilisation, which is why Ultra is hard-locked on Free and overage is a throttle
("short pauses") rather than a cutoff.

**Its escape was building a foundation model.** Cliff Obrecht — the single best
quote on bundler COGS found in this research:

> *"Craft is the first foundation image model from our 160-person Canva Research
> team, built completely from scratch in about six months… **Our AI tools have
> been used more than 38 billion times, and when you're operating at that scale
> even saving a fraction of a cent on each generation adds up to a huge amount.**
> Building our own models gives us much more control over the cost and speed of
> AI."*

Canva cut cost-to-serve **~90%** and **still** had to cut guidance. It has now
twice demonstrated it cannot pass AI COGS to SMBs via list price: the 2024 Teams
hike of up to ~300% was reversed after backlash, then achieved via SKU migration
when Teams was sunset in Oct 2025.

Also relevant: **Canva acquired Leonardo.ai for ≥A$320M (~US$205M)** — not the
widely-cited $120M, which was Leonardo's Dec 2023 Series A valuation. Leonardo
co-founder JJ Fiasson is now Canva's Head of Generative AI.

---

## Picsart — the incumbent that became a direct competitor

~$158M revenue [ESTIMATE], **$1.5B valuation stale since 2021** with no primary
round, secondary mark or tender in five years — a 15.0x revenue multiple it has
not grown into, with SoftBank Vision Fund 2 on the cap table. 1,374 staff. New
CFO hired Sept 2026 *"to drive AI-native video growth strategy."*

**It now runs an open gateway: "One API key · 253 AI models" from "31
providers."** Its own FAQ benchmarks the category: *"**How is this different from
fal.ai, Replicate or OpenRouter?** … most gateways cover one domain — OpenRouter
is text, fal and Replicate are media, Higgsfield is video — while this API covers
image, video, audio and text on one key."*

Two differentiated assets worth noting:
- **Vendor-native compatibility APIs** that pass each vendor's original parameter
  names unrenamed, so request bodies written against the vendor keep working. A
  sharp migration wedge.
- **Getty-licensed indemnified generation** — its in-house lab PAIR built a model
  trained exclusively on Getty's licensed creative content, giving users full
  commercial rights and indemnity, under a **recurring, not one-time-fee**
  arrangement, sellable into both companies' ecosystems.

Weaknesses: **violent pricing instability** (Ultra appears to have gone ~$31.66 →
$60/mo annual in ~6 months at the same 1,500 base credits; `/plans` and `/gold`
now 404; its tutorial, comparison page and pricing page state **three different
credit numbers for the same plan**). **Pro literally cannot buy top-ups** ("Not
currently"). Non-expiring credits are an **Ultra-only paywalled privilege**.
Cancellation friction worse than Canva's.

---

## OpenRouter — the reference business model, now priced

**5.5% on credit purchases** (8% Business, 5% crypto, **$0.80 minimum**), **no
per-token markup on any model**; BYOK free to $25,000/month of list-price
inference then 5% of the excess. ~$5M annualized Jul 2025 → ~$160M Aug 2026
[ESTIMATE — Sacra], implying **~$3B+ of annualized inference spend** flowing
through. **Stripe agreed to acquire for >$7B.** **[REPORTED]**

The **$0.80 floor is regressive**: a $5 top-up pays **16% effective**; the rate
doesn't normalise to 5.5% until ~$15+.

**The lesson:** a ~5% posted, transparent, no-markup take rate is a venture-scale
business when volume is large enough — and the acquirer who paid 45x for it is a
**payments company**, not an AI company. The value was the billing relationship
and the spend data, not the routing.

**The counter-lesson:** OpenRouter's 5% sits on *text* volume, which is orders of
magnitude larger in token terms than media. A media router at 5% needs either
much higher per-call revenue (it has it — a Veo second is ~$0.40 vs fractions of
a cent for tokens) or a different margin source entirely.

**Its stated weakness, from Sacra:** *"As AI model routing becomes more
standardized, low technical barriers to entry could drive price competition that
erodes OpenRouter's 5% commission."* Competitors already market purely as
"OpenRouter without the 5.5% credit fee."

---

## Trustpilot scores, for reliability comparison

| Company | Score | Reviews | Note |
| --- | --- | --- | --- |
| **Runway** | **1.1/5** | 393 | Worst in the dossier |
| **Luma** | **1.4/5** | 72 | *"Reviewers often describe their experiences as scams"* |
| WaveSpeed | 2.3/5 | 6 | No replies to negatives |
| Novita | 2.5/5 | 9 | |
| AI/ML API | 3.5/5 | 23 | Bimodal; replies to 75% of negatives |
| OpenArt | 3.5/5 | ~1,716 | Replies to 56% of negatives |
| Canva | 4.0/5 | 8,330 | |
| Picsart | 4.4/5 | 1,822 | Bimodal (71% 5★ / 17% 1★); **replies to 96%** — actively managed |
| **Leonardo** | **4.7/5** | 1,584 | **Structurally misleading** — ~86% of positives name a support agent and describe a refund being resolved, not the product working |

**Segmind, Eachlabs and WaveSpeed have essentially no Reddit or HN developer
discussion at all** — which is itself the finding: near-zero mindshare against
fal and Replicate.

## Not reached

- **Adobe Firefly** full credit economics and partner-model rate card.
- **Pollo AI** ownership, MAU, revenue, and whether its API is licensed or resold.
- Per-company diligence on **PiAPI, Apiframe, GoAPI, 302.AI, Comet API, Kie.ai**:
  who runs them, country of incorporation, refund-dispute history, and whether
  their Midjourney/Suno endpoints are pooled accounts.
- **Midjourney's and Suno's ToS language and enforcement record** against API
  resellers. Needed before any gray-market claim is published.
- **fal's Gen Media Report Vol. 2** — gated behind a lead form, not completed.
- Company-confirmed revenue for **Baseten, Replicate, WaveSpeed, Luma** — none
  exists; all figures for those are estimates.
