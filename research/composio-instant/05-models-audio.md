# 05 — Audio models

*As of 2026-11-10. Prices marked **(fal)** read off [fal.ai/pricing](https://fal.ai/pricing)
today; **(Google)** off [cloud.google.com/model-garden/pricing](https://cloud.google.com/model-garden/pricing)
today.*

## Why this file matters more than it looks

**Audio is the one modality where real price differentiation still exists.** On
fal today, TTS runs from **$0.015/1K characters (xAI) to $0.10/1K characters
(ElevenLabs)** — a **~7x spread for a nominally similar job** — and open-weight
options sit below both. Compare image and video, where resellers have converged
on the lab's list price to within 2%.

That spread is the margin. It is also a quality judgement the buyer has to make,
which is exactly the kind of decision a routing layer can add value to.

## Text to speech

| Model | Lab | Weights | Where sold | Verified price | Known for |
| --- | --- | --- | --- | --- | --- |
| **ElevenLabs v3** | ElevenLabs | Closed | ElevenLabs, fal, Runway, Luma, Magnific, OpenArt, Picsart | **$0.10/1K chars** (fal) | Current quality benchmark; emotional range |
| **ElevenLabs Multilingual v2** | ElevenLabs | Closed | as above | **$0.10/1K chars** (fal) | The long-standing workhorse |
| **ElevenLabs Turbo v2.5** | ElevenLabs | Closed | as above | **$0.05/1K chars** (fal) | Low-latency tier |
| **ElevenLabs v4 / v4 Turbo** | ElevenLabs | Closed | Runway, Luma, OpenArt, Picsart | **21 cr/1K chars ≈ $0.063** (Luma Plus); **$0.08/1K** (Picsart) | Newest line; not yet on fal's public price table |
| **MiniMax Speech 2.8 HD** | MiniMax | Closed | MiniMax, fal | **$0.10/1K chars** (fal) | |
| **MiniMax Speech 2.8 Turbo** | MiniMax | Closed | MiniMax, fal | **$0.06/1K chars** (fal) | |
| **MiniMax Speech-02 HD** | MiniMax | Closed | fal | **$0.10/1K chars** (fal) | Previous generation |
| **Gemini 3.1 Flash TTS** | Google | Closed | Gemini API, fal | **$0.05/1K chars** (fal) | Bundled with the Gemini line |
| **xAI TTS v1** | xAI | Closed | xAI, fal | **$0.015/1K chars** (fal) | **Cheapest closed-model TTS verified — ~7x below ElevenLabs** |
| **Grok TTS** | xAI | Closed | Eachlabs | $0.000015/char = $0.015/1K | Consistent with the fal rate |
| **Cartesia Sonic / Sonic-2 / Sonic-3** | Cartesia | Closed | Cartesia, Together, Baseten | **$65/M chars = $0.065/1K** (Together) | Very low latency; strong for realtime agents |
| **Inworld TTS / TTS 2** | Inworld | Closed | Inworld, fal, Novita | **$25/M chars = $0.025/1K** (Novita) | |
| **Qwen3-TTS (1.7B)** | Alibaba | **Open** | fal, Segmind | price not verified | Open-weight, self-hostable |
| **Chatterbox** | Resemble AI | **Open** | fal, Segmind | price not verified | Open-weight voice cloning |
| **Dia TTS (voice clone)** | — | **Open** | fal (`dia-tts/voice-clone`) | price not verified | |
| **Kokoro-82M** | — | **Open** | Together, Segmind | **$4/M chars = $0.004/1K** (Together) | **~25x below ElevenLabs. 1.6s latency on Segmind.** The open-weight price floor |
| **Orpheus 3B** | — | **Open** | Together, Baseten | **$15/M chars = $0.015/1K** (Together) | |
| **VoxCPM2 / Gradium / MARS6 / MARS8-Flash** | various / CAMB.AI | mixed | Baseten | price not verified | MARS is CAMB.AI's; Baseten hosts as BYO-deployment |
| **Fish Audio S2 Pro / Drama 3** | Fish Audio | Closed | Fish Audio, Novita, Runway, OpenArt | **$15/M chars = $0.015/1K** (Novita) | |
| **Async TTS Pro v1.0** | Async | Closed | fal | price not verified | |
| **Higgsfield Speak** | Higgsfield | Closed | Higgsfield | price not verified | First-party |
| **Hume Octave** | Hume | Closed | Hume | price not verified | Emotional prosody control |
| **Deepgram Aura** | Deepgram | Closed | Deepgram, Eachlabs | price not verified | |
| **PlayAI / PlayHT** | PlayAI | Closed | PlayAI, Replicate (`playht/`) | price not verified | **An early named fal partner (Feb 2025)** |
| **Rime, Neuphonic, Respeecher** | various | Closed | first-party | not verified | Not found in any aggregator catalog scraped today |

## Music

| Model | Lab | Weights | Where sold | Verified price | Notes |
| --- | --- | --- | --- | --- | --- |
| **Lyria 3 Pro** | Google | Closed | Vertex, fal, Runway | **$0.08 per full song** (Google) | Full-length composition from text or image |
| **Lyria 3** | Google | Closed | Vertex, fal (`fal-ai/lyria3`, `/pro`) | **$0.04 per 30s clip** (Google) | |
| **Lyria 2** | Google | Closed | Vertex, OpenArt | **$0.06 per generation** (Google) | |
| **ElevenLabs Music / Music v2.5** | ElevenLabs | Closed | ElevenLabs, fal, Runway, Luma, Magnific | **98 cr/min ≈ $0.294/min** (Luma Plus) | |
| **MiniMax Music v2 / v2.5 / v2.6** | MiniMax | Closed | MiniMax, fal | price not verified | Three live versions on fal |
| **ACE-Step / ACE-Step 1.5** | — | **Open** | fal, Eachlabs | **$0.0002/s** (fal) = **$0.012/min**; $0.018–0.036/min (Eachlabs) | **~25x below ElevenLabs Music. The open-weight floor for music.** |
| **Sonilo v1.1 text-to-music** | Sonilo | Closed | fal | price not verified | |
| **Suno** | Suno | Closed | **No public API** | n/a | ~$200M revenue, $5.4B valuation. **A fal *customer* (named on fal's pricing page), not a supplier.** Any "Suno API" is by construction unofficial |
| **Udio** | Udio | Closed | No public API found | n/a | |
| **Mureka** | Mureka | Closed | Eachlabs (17 models) | price not verified | One of the larger music suppliers inside an aggregator |
| **Stable Audio** | Stability | mixed | Stability | price not verified | Not found in catalogs scraped today |

## Sound effects

| Model | Lab | Where sold | Verified price |
| --- | --- | --- | --- |
| **ElevenLabs Sound Effects v2** | ElevenLabs | fal, Runway, Luma, OpenArt | **$0.002/s** (fal) |
| **Sonilo v1.1 text-to-sound-effects** | Sonilo | fal | price not verified |
| **Sonilo v1.1 video-to-sound-effects** | Sonilo | fal | price not verified — **generates SFX matched to supplied footage, a genuinely distinct capability** |
| **Mirelo SFX 2.0** | Mirelo | OpenArt, Replicate (`mirelo/`) | price not verified |

## Speech to text, dubbing and voice conversion

Included because a media API is usually asked for these in the same breath.

| Capability | Options | Verified price |
| --- | --- | --- |
| **STT** | Whisper large-v3 (**$0.0015/audio-min**, Together; streaming $0.0035), Parakeet TDT 0.6B v3 ($0.0015), ElevenLabs Scribe, Qwen3 ASR (**$0.000035/s**, Eachlabs), Deepgram Nova-3 ($0.0000725–0.000148/s), Voxtral Mini 4B Realtime, MOSS Transcribe Diarize, NVIDIA Nemotron 3 Diarization (Baseten) | Whisper is effectively free at these rates |
| **Google STT** | Chirp / Gemini transcribe | **~$0.005/min** (standard), **~$0.009/min** (live) (Google) |
| **Dubbing** | ElevenLabs Dubbing (on Runway), CAMB.AI, Papercup | price not verified |
| **Voice conversion / speech-to-speech** | ElevenLabs speech-to-speech (on Runway), Kits.ai, Respeecher | price not verified |
| **Audio isolation / stem separation** | ElevenLabs audio isolation + stem separation (Luma, Runway) | price not verified |
| **Voice cloning** | ElevenLabs, Chatterbox (open), Dia (open), Higgsfield `create_voice` | — |
| **Seed Audio 1.0 / Multilingual** | ByteDance | fal, Runway (**15 cr/min = $0.15/min**), Picsart (**$0.1875/min**) | |

## The pricing ladder, summarised

Per 1,000 characters of TTS, from the verified numbers above:

| Tier | $/1K chars | Examples |
| --- | --- | --- |
| **Open weights, self-hostable** | **$0.004–0.015** | Kokoro-82M $0.004, Orpheus $0.015, Qwen3-TTS, Chatterbox |
| **Cheap closed** | **$0.015–0.025** | xAI $0.015, Fish Audio $0.015, Inworld $0.025 |
| **Mid closed** | **$0.05–0.065** | Gemini Flash TTS $0.05, ElevenLabs Turbo $0.05, MiniMax Turbo $0.06, Cartesia $0.065 |
| **Premium closed** | **$0.10** | ElevenLabs v3, ElevenLabs Multilingual v2, MiniMax Speech 2.8 HD |

**A 25x range from floor to ceiling.** For music the same pattern holds: ACE-Step
at $0.012/min against ElevenLabs Music at $0.294/min — **~25x**.

## The supplier to watch

**ElevenLabs is at $600M ARR and a $22B valuation (Oct 2026), with 55% of revenue
from large organisations** — so it is the one audio counterparty with enough
leverage to set terms rather than take them. It also already ships first-party
endpoints on fal, Runway, Luma, Magnific, OpenArt and Picsart, so distribution
deals are clearly available.

But note what its self-serve terms say about credits, quoted in full in
[08-partner-targets.md](08-partner-targets.md): *"Prepaid Credits may not be
transferred, sold, gifted, traded, sublicensed, or assigned… any purported
transfer is void."*

## Not reached

- Verified prices for Hume Octave, Deepgram Aura, PlayAI, Rime, Neuphonic,
  Respeecher, CAMB.AI, Papercup, Stable Audio, Mureka, MiniMax Music.
- **ElevenLabs v4 pricing on a first-party rate card** — only reseller-derived
  numbers were verified.
- **Suno's and Udio's ToS and enforcement posture** toward unofficial API
  resellers. Needed before any claim about "Suno API" products.
- Whether any aggregator has a **licensed music** offering with cleared rights
  for commercial release, which is the obvious compliance gap in this modality.
