# 03 — Image models

*As of 2026-11-10. Prices marked **(fal)** were read directly off
[fal.ai/pricing](https://fal.ai/pricing) today. Prices marked **(Google)** were
read off [cloud.google.com/model-garden/pricing](https://cloud.google.com/model-garden/pricing)
today. Anything without a verified source is marked **price not verified** rather
than guessed.*

## How to read this

The catalog below is built from **172 live fal endpoints enumerated directly**,
cross-checked against Google's and Replicate's own rate cards. That makes it a
record of **verified-present supply** rather than a wish list.

Its most useful property for partnership work: **every lab named here has already
signed a distribution deal with at least one third party.** That turns the partner
question from "is this possible" into "what are the terms" — see
[08-partner-targets.md](08-partner-targets.md).

## Generation — the frontier tier

| Model | Lab | Weights | Where sold | Verified price | Known for |
| --- | --- | --- | --- | --- | --- |
| **Nano Banana Pro** (Gemini 3 Pro Image) | Google | Closed | Gemini API, Vertex, fal, Replicate, Together, Runway, Luma, Krea, Magnific, OpenArt, Higgsfield | **$0.134/img @1K–2K, $0.24 @4K** (Google); **$0.15 / $0.30** (fal, Replicate) | Current quality leader for prompt adherence and in-image text |
| **Nano Banana 2** (Gemini 3.1 Flash Image) | Google | Closed | as above | **$0.045 @0.5K, $0.067 @1K, $0.101 @2K, $0.151 @4K** (Google); **$0.08** (fal) | The volume workhorse |
| **Nano Banana 2.1** | Google | Closed | Gemini API, fal (`google/nano-banana-2.1`) | **$0.0336 @1K, $0.0504 @2K, $0.113 @4K** (Google) | Cheapest Google tier |
| **Nano Banana** (original) | Google | Closed | widely | **$0.039** (Google); **$0.0398** (fal) | 123.5M runs on Replicate alone |
| **GPT Image 2** | OpenAI | Closed | OpenAI, fal, Runway, Krea, OpenArt, Picsart, Higgsfield | **~$1/unit** (fal); $0.005–$0.401 by quality/size elsewhere | Instruction following, text rendering |
| **GPT Image 2.5** (Flare / Sunburst) | OpenAI | Closed | fal, Runway, Magnific, OpenArt, WaveSpeed | **$0.01** (WaveSpeed, unverified) | Two distinct variants — Flare and Sunburst are not interchangeable |
| **GPT Image 2.6** | OpenAI | Closed | fal (landing page), Segmind, OpenArt | price not verified | Newest OpenAI image tier |
| **FLUX 3 Image** | Black Forest Labs | Closed | BFL API, Replicate, fal | **$0.041 @768px, $0.048 @1K, $0.07 @1.5K, $0.10 @2K, $0.607 @4K** — Replicate matches BFL to three decimals | Frontier open-lab quality |
| **FLUX 2** family (dev / pro / flex / max / Klein) | Black Forest Labs | **dev + Klein open** | BFL, Replicate, fal, Together, Krea, Magnific | Together: **$0.0154 (dev), $0.03 (pro), $0.07/MP (max)** | **dev is where reseller margin exists — BFL has no hosted dev API** |
| **FLUX.1** (schnell / dev / pro / Kontext) | Black Forest Labs | **schnell + dev open** | everywhere | **$0.003/MP (schnell)**, $0.04/img (Kontext pro) (fal) | **flux-schnell alone is 26% of all official-model runs on Replicate** |
| **Seedream 5.0** (Pro / Lite / Flash) | ByteDance | Closed | BytePlus, fal, Runway, Luma, Magnific, OpenArt, WaveSpeed, Segmind | Together: $0.035 (5.0 Lite); WaveSpeed $0.027–0.045 (unverified) | Strong photoreal |
| **Seedream 4 / 4.5** | ByteDance | Closed | widely | Together: $0.03 / —; **40.2M + 37.6M runs on Replicate** | Previous generation, still high volume |
| **Krea 3** | Krea | Closed | Krea, fal (`krea/v3`) | **$0.03 @1K, $0.06 @2K** (Krea API) | Aesthetic tuning; native 2K edit |
| **Qwen Image 3** | Alibaba | **Open** | Alibaba, fal, Together, Segmind | Together: $0.0058 (Qwen Image), $0.035–0.075 (2.0 / 2.0 Pro) | Best open-weight option for self-hosting |
| **Z-Image / Z-Image Turbo** | — (Alibaba/Tongyi lineage) | **Open** | fal, WaveSpeed, Canva, Krea | **$0.005/MP** (fal); $0.005 (WaveSpeed) | **59.7M runs on Replicate via Pruna's distill**; cheapest credible tier |
| **Recraft V4 / V4 Pro / V4.1** | Recraft | Closed | Recraft, fal, Runway, Magnific, OpenArt | fal V3 $0.04 ($0.08 vector) | **Vector/SVG output — a genuinely differentiated capability** |
| **Ideogram 4 / 4.5 / Vector** | Ideogram | Closed | Ideogram, Replicate, fal, Together, Runway, Magnific, Krea | Together: $0.06 (3.0/4.0) | Typography; **21.6M runs on Replicate** |
| **Grok Imagine Image 2** | xAI | Closed | xAI, fal, Runway, Magnific, OpenArt, Picsart | price not verified | Fast, permissive |
| **MiniMax H3-Image** | MiniMax | Closed | MiniMax, fal (incl. `highspeed` variants) | price not verified | Bundled with its video line |
| **Bria FIBO 2 / FIBO Edit 1.5** | Bria | Closed | Bria, fal | fal $0.04 (FIBO) | **Licensed training data + indemnity — the compliance-safe option** |
| **Imagen 3 / 4 / 4 Fast / 4 Ultra** | Google | Closed | Vertex, Krea, Picsart | price not verified | Being superseded by the Nano Banana line |
| **Leonardo Phoenix / Lucid Origin** | Leonardo (Canva) | Closed | Leonardo, Canva Connect API | price not verified | `lucid_origin` is one of three models Canva's API will pin |
| **CRAFT-1** | **Canva** | Closed | Canva Connect API (`craft_v1_2k`) | consumes end user's AI allowance | Trained on Canva's own design templates, not photos. 4th on DesignArena overall, #1 for People & Portraits. **~50–60s latency** |
| **Magnific Mystic / Magnific One** | Magnific | Closed | Magnific | 250 cr ≈ $0.181 (Magnific One High 4K) | First-party; Brand Kit checks output against guidelines |
| **Midjourney** | Midjourney | Closed | **No public API** | n/a | ~$500M ARR, bootstrapped. **Any "Midjourney API" is by construction built on reverse-engineered endpoints** — see [11-legal-compliance.md](11-legal-compliance.md) |

## Editing and utility — where the catalog is deepest

Background removal has more competing supply than any other single task, which
makes it the clearest commodity in the category:

| Task | Options observed | Verified price |
| --- | --- | --- |
| **Background removal (image)** | `bria/guided-remove-background`, `fal-ai/bria/background/remove`, `fal-ai/birefnet/v2`, `fal-ai/imageutils/rembg`, `fal-ai/ideogram/remove-background`, `pixelcut/background-removal`, Picsart `picsart-sod-v8-2` | Picsart first-party **from $0.0011/gen**; Picsart legacy platform charges **8 credits**; Eden AI resells Picsart's at **$0.04/image** — **a ~36x markup in the reseller chain** |
| **Background removal (video)** | `bria/video/background-removal` + `/v3`, `/realtime`, `/green-screen-despill` | price not verified |
| **Upscaling** | Topaz generative image + video, `openimaginglab/flashvsr-plus`, Magnific Precision/Creative, Recraft Crisp, Clarity | Magnific Precision 2K ≈ **$0.065**; Topaz 4K video **2 cr/s ≈ $0.02/s** (Runway) |
| **SDR → HDR** | `topaz/sdr-to-hdr/video`, Runway Ruby (20 cr/s) | Runway Ruby **$0.20/s** |
| **Virtual try-on** | `fashn/tryon/v1.5` + `v1.6`, `leffa/virtual-tryon`, `flux-2-lora-gallery/virtual-tryon`, `image-apps-v2/virtual-try-on`, `kling/v1-5/kolors-virtual-try-on`, `decart/lucy2-vton/realtime`, `bria/fibo-edit-1.5/virtual-try-on` | price not verified |
| **Outpaint / expand / reframe** | `lightricks/ltx-2.5/reframe`, Higgsfield outpaint, Picsart AI Expand | Picsart 3–5 credits |
| **Segmentation** | `fal-ai/sam-3/3d-objects` (Meta SAM 3) | **$0.02/unit** (fal) |
| **Real-ESRGAN** | community | **103.5M runs on Replicate — the 3rd most-run media model on the platform** |

## LoRA / fine-tuning as a product line

fal ships **seven distinct trainers**: `flux-2-trainer-v2`,
`flux-2-klein-{4b,9b}-base-trainer`, `flux-kontext-trainer`,
`flux-lora-fast-training`, `flux-lora-portrait-trainer`, `qwen-image-trainer`,
`z-image-trainer`.

That is a deliberate retention surface, not an afterthought — **it creates
artifacts a customer cannot take elsewhere.** Segmind prices fine-tuning per
GPU-second (A100 40GB $0.002/s, H100 80GB $0.0043/s) with flat Flux-Pro LoRA
tiers at **$3 / $6 / $9** by step count. Leonardo and Krea both gate LoRA image
counts by plan tier (Krea: 50 images on Basic/Pro, **2,000 and unlimited
trainings on Max**).

## Price spread, for orientation

At the cheap end, **FLUX.1 schnell at $0.003/MP** and **Z-Image Turbo at
$0.005/MP**. At the frontier, **Nano Banana Pro 4K at $0.24–0.30** and **FLUX 3
at 4K for $0.607**. That is a **~200x spread** across the image catalog, and it
is why every platform studied routes aggressively toward cheap models and
publishes guidance to do so. Picsart's own tutorial: *"Use cheaper models for
iteration… This saves 60-70% on credits."*

## Not reached

- **Stability AI** (SD3.5, SDXL), **HiDream**, **Playground**, **Luma Photon**,
  **Reve**, **Hunyuan Image**, **Kolors**, **Aurora** — present in the market but
  not verified in any catalog scraped today. SDXL survives mainly as a cheap
  baseline (Modal publishes **$0.000491/image** on A10G).
- Per-model prices for Imagen, Grok Imagine Image, MiniMax H3-Image, Leonardo
  Phoenix, Seedream 5.0 at each tier.
- **Commercial-resale licensing notes per model**, which is the single biggest gap
  in this file. [08-partner-targets.md](08-partner-targets.md) covers the
  provider level; per-model license terms were not verified.
