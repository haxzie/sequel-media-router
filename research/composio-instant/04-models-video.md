# 04 — Video models

*As of 2026-11-10. **Every price here states resolution and audio flag.** This is
not pedantry: the same Veo 3.1 Fast reseller price looks like parity or a 2x
markup depending on which Google row you compare it against, and that error
appeared twice during this research.*

## Google's rate card — the market's price anchor

Read directly off [cloud.google.com/model-garden/pricing](https://cloud.google.com/model-garden/pricing)
today. Everything else in the Western market prices against these numbers.

| Tier | With audio | Silent |
| --- | --- | --- |
| **Veo 3.1** 720p / 1080p | **$0.40/s** | **$0.20/s** |
| Veo 3.1 4K | $0.60/s | $0.40/s |
| **Veo 3.1 Fast** 720p | **$0.10/s** | $0.08/s |
| **Veo 3.1 Fast** 1080p | **$0.12/s** | $0.10/s |
| Veo 3.1 Fast 4K | $0.30/s | $0.25/s |
| **Veo 3.1 Lite** 720p | **$0.05/s** | $0.03/s |
| Veo 3.1 Lite 1080p | $0.08/s | $0.05/s |
| Veo 3 / Veo 3 Fast | same as 3.1 equivalents | |
| Veo 2 720p | — | $0.50/s |

**No free tier on Veo.**

## Generation — the frontier tier

| Model | Lab | Weights | Where sold | Verified price | Notes |
| --- | --- | --- | --- | --- | --- |
| **Veo 3.1** (+ Fast, Lite) | Google | Closed | Vertex, Gemini API, fal, Replicate, Together, Runway Dev, Luma, Krea, Magnific, OpenArt, Segmind, Eachlabs, AI/ML API, WaveSpeed | see table above | **Resold at exactly list by Runway Dev, Replicate, Segmind, Eachlabs; below list by Luma (−21% to −42%), OpenArt (−38% to −71%), AI/ML API (−50%)** |
| **Kling 4.0** (+ 4.0 Flash) | Kuaishou | Closed | Kling dev API, fal, Replicate, Runway Dev, Luma, Magnific, OpenArt, WaveSpeed, Picsart | **$0.157/s @720p, $0.235/s @1080p** — *identical at Replicate, fal, Runway Dev and WaveSpeed simultaneously*; Flash **$0.094/s** | 3–30s, 720p/1080p, optional end frames, per-shot prompts |
| **Kling 3.0** (Std / Pro / 4K / Omni / O3) | Kuaishou | Closed | widely | **$0.14/s** (fal v3 Pro); $0.112/s (Higgsfield API, 1080p no audio); $0.084/s (WaveSpeed Std) | Native audio generation on Pro |
| **Kling 2.5 Turbo Pro** | Kuaishou | Closed | widely | **$0.07/s** (fal); **$0.042/s** (Higgsfield API) | **Higgsfield sells it 40% below fal** |
| **Seedance 2.5** | ByteDance | Closed | BytePlus, fal (`/us/` route), Replicate, Together, Luma, Magnific, OpenArt, WaveSpeed, Segmind, Higgsfield | **BytePlus official: $0.1028/s @480p, $0.2312 @720p, $0.569 @1080p** | Native 30s clips. **Official route is geo-blocked from US/CA/UK/AU/NZ** |
| **Seedance 2.0** (+ Fast / Mini) | ByteDance | Closed | widely | **$0.014/1K tokens** (fal); $0.0809/s (Krea API) | Token-billed, which makes cross-provider comparison hard |
| **MiniMax H3** | MiniMax | **Open weights** | MiniMax, fal, Runway, Luma, Novita, WaveSpeed, OpenArt | **$0.04/s** (WaveSpeed); $0.08/s @768p (Novita); $0.13/s (Higgsfield API) | **Open weights are why fal could build H3 Max** |
| **MiniMax H3 Max** | MiniMax + **fal post-train** | — | **fal (exclusive variant)** | **$0.03/s** t2v and i2v; **$0.05/s** reference-to-video | Claimed **~35x the throughput of MiniMax's own endpoint** |
| **MiniMax H3 Max Turbo** | MiniMax + fal | — | fal, Picsart | **$0.015/s** (fal) | Cheapest credible frontier-adjacent tier |
| **FLUX 3 / FLUX 3 Max (video)** | Black Forest Labs | Closed | BFL, fal, Runway, Luma, Magnific | **17 cr/s = $0.17/s** (Runway Dev); $0.15–0.24/s (Luma) | **BFL has moved into video.** "FLUX 3 Max, post-trained by fal" |
| **Runway Gen-4.5** | Runway | Closed (**weights licensable**) | Runway, Krea API, Adobe Firefly | **$0.12/s** (Runway Dev **and** Krea API — exactly matching) | **Top of the text-to-video leaderboard at 1,247 Elo** |
| **Runway Gen-4 / Gen-4 Turbo** | Runway | Closed | Runway, Picsart, Leonardo | Gen-4 Turbo **5 cr/s = $0.05/s** | |
| **Runway Aleph 2.0** | Runway | Closed | Runway | **28 cr/s = $0.28/s** | Video-to-video editing |
| **Luma Ray3.2 / Ray3.14** | Luma | Closed | Luma app + API, Adobe Firefly, AWS Bedrock (Ray2) | **$1.20 per 5s @1080p** (= $0.24/s); 720p $0.06/s | **16 keyframes per clip, V2V to 20s, native HDR + 16-bit EXR export** |
| **Wan 3.0 / 3.0 Prime** | Alibaba | **Open** | Alibaba, fal, Runway, Magnific, OpenArt, Segmind, WaveSpeed | **$0.05/s** (WaveSpeed); $0.20/s (Higgsfield API) | Best open-weight video option |
| **Wan 2.x** | Alibaba | **Open** | widely | $0.01/s (Wan 2.2 Ultra Fast, WaveSpeed) | `wan-2.2-i2v-fast` has **15.2M runs on Replicate** |
| **Grok Imagine Video 1.5** | xAI | Closed | xAI, fal, Runway, Magnific, OpenArt, Eachlabs | $0.05–0.07/s (Eachlabs) | Includes edit-video and extend-video endpoints |
| **LTX 2.5** | Lightricks | **Open lineage** | Lightricks, fal, Runway, Magnific, OpenArt | price not verified | **Ships `alpha-gen` — alpha-channel generation, rare and genuinely useful** |
| **PixVerse V6** | PixVerse | Closed | fal, Runway, Luma, Magnific, Novita, Eachlabs | $0.115/s (Higgsfield API); $0.025–0.115/s (Eachlabs) | |
| **Vidu Q3** | Shengshu | Closed | Vidu, Together, Magnific, Novita | Together **$0.0975**; Novita **from $0.0179/s off-peak** | **Novita exposes an explicit `off_peak: true` flag — time-of-day price discrimination** |
| **HappyHorse 1.0 / 1.1** | — | Closed | Together, Runway, OpenArt, Eachlabs | Together $0.14 | |
| **Sora 2** | OpenAI | Closed | **withdrawn** | n/a | **Models and Videos API deprecated Mar 2026, shut down Sept 2026, no named replacement.** Higgsfield and OpenArt both now serve tombstone pages |
| **Marey** | Moonvalley | Closed | Moonvalley, Adobe Firefly | price not verified | Licensed-data / clean-provenance positioning |
| **Pika** | Pika | Closed | Pika API, Adobe Firefly, Picsart | ~$0.108–0.243/s (unverified) | |

## The editing verbs — more important than another t2v model

For an **API-first** product, this is the section that matters. An agent composing
a pipeline needs these far more than it needs a seventh text-to-video model, and
supply is much thinner.

| Verb | What it does | Options observed |
| --- | --- | --- |
| **Recast / character replacement** | Swap people in a video using reference photos, preserving motion, camera, cuts and audio | `minimax/h3-max/recast`, `wavespeed-ai/openjutsu/character-swap`, Higgsfield Genjutsu, Kling Motion Control |
| **Relight** | Relight a video from a lighting-sphere image, preserving subjects and motion | `minimax/h3-max/relight` |
| **Extend** | Continue an existing clip | `minimax/h3-max/extend-video`, `xai/grok-imagine-video/extend-video`, Seedance video-extend, WaveSpeed |
| **Director / realtime steering** | Continuous realtime stream with live prompts, preserving characters and continuity | `minimax/h3-max/director`, `/reference-director` |
| **Reframe** | Change aspect ratio intelligently | `lightricks/ltx-2.5/reframe`, Luma Reframe (**$0.36/s @1080p** at Plus) |
| **Lipsync** | Sync mouth movement to supplied audio | `fal-ai/sync-lipsync/v2` + `v3`, `minimax/h3-max/lip-sync/image-to-video`, `fal-ai/kling-video/lipsync/audio-to-video`, Latentsync | Sync Lipsync 3 **$0.135/s** (Luma Plus), $0.107/s (Eachlabs) |
| **Avatar / talking head** | Generate a presenter from image + audio | `fal-ai/heygen/avatar5/digital-twin`, `fal-ai/bytedance/omnihuman/v1.5`, `fal-ai/ai-avatar/single-text`, `fal-ai/creatify/aurora`, Hedra, Synthesia, Argil, **Runway Characters** (realtime conversational, 2 cr + 2 cr/6s) |
| **Motion transfer** | Apply one subject's motion to another | `fal-ai/hunyuan-motion` (**$0.08/generation**), Higgsfield Genjutsu, Kling Motion Control |
| **Object swap** | Replace an object in-place | `wavespeed-ai/openjutsu/object-swap`, Higgsfield `hf_mult_replace_object` |
| **Video upscale** | Resolution increase | `topaz/upscale/video/generative`, `lightricks/ltx-2.5/upscale`, `openimaginglab/flashvsr-plus`, ByteDance Video Enhance (**$0.0038/s**, Picsart) |
| **SDR → HDR** | Dynamic-range expansion | `topaz/sdr-to-hdr/video`, `lightricks/ltx-2.5/hdr`, Runway Ruby ($0.20/s) |
| **Alpha generation** | Generate with transparency | `lightricks/ltx-2.5/alpha-gen` — **rare** |
| **Background removal (video)** | Matting | `bria/video/background-removal` with `/realtime` and `/green-screen-despill` variants |
| **Video→SFX** | Generate sound effects matched to footage | `sonilo/v1.1/video-to-sound-effects` |

## The billing traps, which are the real cost

These recur across every platform and are the most common source of a surprise
bill. Any dossier reader modelling spend should assume all four apply:

1. **Reference / V2V jobs bill input seconds as well as output seconds.** 10s of
   reference + 10s of output ≈ **20 counted seconds**. Runway's Seedance 2.5
   1080p bills **68 cr/s of output plus 34 cr/s of input, with an 80-credit
   minimum**. Segmind's own docs call reference billing *"the single most common
   source of a surprising bill"*, with a ⅔-of-output floor and **no cap**.
2. **Replicate's reference-video rate is the market's worst** —
   **$0.9676 per counted second at 720p** vs fal's $0.2838 and EvoLink's $0.179. A
   10s edit of a 10s source costs **~$9.68 on Replicate vs ~$3.58 on EvoLink.**
   Keep Replicate for t2v/i2v, not edits.
3. **"4K" from a reseller is often an upscale, not native output.** ByteDance only
   announced native 4K Seedance on 2026-10-23, for selected enterprise customers,
   unpriced. Reseller 1440p/4K tiers before that are super-resolution.
4. **Format and HDR surcharges.** Runway: ProRes/PNG-sequence **+5 cr/s**, HDR
   profiles **+20 cr/s (+40 above 4MP)**. Luma: HDR **2x**, HDR+EXR **3x**.

## Cross-provider spread on one model

Seedance 2.5, **720p, per output second**, read 2026-10-14. This is the single
best illustration that the market is informationally broken:

| Provider | $/s @720p | vs official |
| --- | --- | --- |
| **BytePlus ModelArk (official)** | **$0.2312** | — |
| Replicate | $0.2312 | **0%** |
| Segmind | $0.2389 | +3% |
| WaveSpeed **Turbo** | **$0.20** | **−13%** ⚠️ |
| reAPI | $0.2668 | +15% |
| EvoLink | $0.296 | +28% |
| Atlas Cloud | $0.30 | +30% |
| Kie.ai | $0.315 | +36% |
| WaveSpeed (standard) | $0.36 | +56% |
| BytePlus LAS (managed, official) | $0.4621 | +100% (different product) |
| **fal** | **$0.4730** | **+105%** |

**fal is the most expensive mainstream door for this model and still wins
developers** — strong evidence the buyer pays for latency, breadth and day-zero
availability, not price.

A separate r/ThirdPartyAPI check across **16 vendors found $1.20 to $3.41 for an
identical 5-second 1080p Seedance 2.0 clip** — a 2.8x spread.

⚠️ **The WaveSpeed Turbo anomaly is unresolved and matters.** Sub-official
pricing implies one of: a negotiated volume rate, a distilled substitute served
under the brand name, an upscale from lower native resolution, or subsidised
capacity. All four carry very different risks. **Verify before relying on it.**

## Volume reality check

From Replicate's public run counts: **all 12 Kling models together are 7.8M runs
— 0.8% of Black Forest Labs' image volume.** Seedance 2.5 is 369.8K. Veo 3.1 is
677.1K. Kling 4.0 is **15.8K**.

**Video is high-ASP and low-count; image is the volume engine.** And new models
have almost no usage for 6–12 months, which should temper any "we must have
everything on launch day" roadmap. See
[07-volume-concentration.md](07-volume-concentration.md).

## Not reached

- **Hunyuan Video** (Tencent, open), **Mochi** (Genmo), **CogVideoX**, **Marey**
  (Moonvalley) pricing, **Higgsfield's first-party video line** (Cinema Studio
  Video 3.0, DoP, Soul Cast) at verified rates.
- **HeyGen, Hedra, Synthesia, Argil** standalone pricing and terms — only their
  presence inside aggregators was verified.
- Native-4K availability and pricing across providers post-2026-10-23.
