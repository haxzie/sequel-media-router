# 06 — 3D and adjacent models

*As of 2026-11-10. Lighter coverage by design — 3D was scoped as secondary. All
fal prices read off [fal.ai/pricing](https://fal.ai/pricing) today.*

## Image/text to 3D

| Model | Lab | Weights | Where sold | Verified price |
| --- | --- | --- | --- | --- |
| **Tripo H3.1** (image / text / multiview to 3D) | Tripo | Closed | Tripo, fal (`tripo3d/h3.1/*`), Runway | **$0.01/credit** (fal) |
| **Trellis** | Microsoft lineage | **Open** | fal | **$0.02/generation** (fal) |
| **Trellis 2** | Microsoft lineage | **Open** | fal | **$0.05/unit** (fal) |
| **Hunyuan3D v3.1 Pro** (image / text to 3D) | Tencent | **Open** | Tencent, fal | **$0.015/unit** (fal) |
| **Hunyuan3D v3.1 Rapid** (text to 3D) | Tencent | **Open** | fal | price not verified |
| **Hunyuan3D v3** | Tencent | **Open** | fal | price not verified |
| **Meshy 6 Preview** (image to 3D) | Meshy | Closed | Meshy, fal | **$0.80/generation** (fal) |
| **Meshy v7.1** (image / text to 3D) | Meshy | Closed | Meshy, fal (`meshy/v7.1/*`) | price not verified |
| **Meshy** (via Higgsfield) | Meshy | Closed | Higgsfield | Includes **rigging and a 678-action animation library** |
| **Rodin v2.5** (image / text to 3D, + fast) | Hyper3D | Closed | Hyper3D, fal (`hyper3d/rodin/v2.5/*`), Replicate | price not verified |
| **SAM 3 (3D objects)** | **Meta** | Open | fal (`fal-ai/sam-3/3d-objects`), Higgsfield | **$0.02/unit** (fal) |
| **Hunyuan Motion (1B)** | Tencent | Open | fal | **$0.08/generation** (fal) |
| **Stability SPAR3D** | Stability | mixed | Stability | not found in catalogs scraped today |

## World models — the emerging category

| Model | Lab | Where sold | Notes |
| --- | --- | --- | --- |
| **GWM-1** | Runway | Runway | Runway's world model; it is pivoting here post-Gen-4.5 |
| **Solaris** | Runway | Runway (research preview) | Interface world models — generates software UIs in realtime with no code underneath. A 250-person study preferred it over coded interfaces **61%** on instruction-following and **71%** on natural behaviour |
| **Marble** | World Labs | World Labs | **World Labs is a fal customer** (named on fal's pricing page). Took $200M from Autodesk, Feb 2026, at ~$5B; **reportedly acquired by AMD for $8.2B** |
| **abot-world-0** | Alibaba | fal (`alibaba/abot-world-0`) | |
| **lingbot-world-2** | Robbyant | fal (`robbyant/lingbot-world-2`) | |
| **OpenArt Worlds** | OpenArt | OpenArt | Consumer-facing 3D/world feature |
| **Odyssey** | Odyssey | — | not verified in any catalog scraped today |

## The price spread is extreme

**Tripo H3.1 at $0.01 against Meshy 6 Preview at $0.80 — an 80x spread for a
nominally similar image-to-3D job.** Trellis at $0.02 and Hunyuan3D Pro at $0.015
sit near Tripo.

Two readings, and the research did not settle which is right:
- The outputs are genuinely not comparable (mesh quality, topology, UV
  unwrapping, PBR materials, rig readiness).
- Or Meshy is priced on brand and workflow rather than compute.

Higgsfield's Meshy integration — which bundles **rigging and a 678-action
animation library** — suggests the first reading has some substance, since that is
pipeline work rather than inference.

## Why 3D matters less than its catalog depth suggests

3D is **well supplied and cheap**: at least six independent labs with live
endpoints, two of them fully open-weight (Trellis, Hunyuan3D), at $0.01–0.05 per
generation. There is no scarcity to arbitrage and no obvious partner leverage to
win.

No run-count or usage data for 3D was found on any platform, so there is **no
evidence that 3D carries meaningful volume** on any aggregator. Replicate's public
counts, which do cover media comprehensively, surface no 3D publisher in the top
tier at all.

Treat 3D as a completeness item, not a wedge.

## Not reached

- **Verified prices** for Meshy v7.1, Rodin v2.5, Hunyuan3D Rapid.
- **Any usage or volume data for 3D** on any platform.
- **Commercial-use and resale licensing** for 3D outputs specifically, which
  differs from 2D in practice (game-asset pipelines have their own licensing
  norms).
- **World Labs' status post-AMD** and whether Marble remains independently
  available.
- Stability SPAR3D, Odyssey, and the broader Gaussian-splat tooling category.
