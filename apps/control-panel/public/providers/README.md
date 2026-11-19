# Provider brand marks

Used only to identify each model's provider in the catalog. Each mark is the
trademark of its owner; none of them endorse this project.

| File | Source | Retrieved |
| --- | --- | --- |
| `google.svg`, `openai.svg`, `alibaba.svg`, `elevenlabs.svg`, `deepgram.svg`, `minimax.svg` | [Simple Icons](https://simpleicons.org) (CC0-1.0 for the collection; the marks themselves remain trademarks) | 2026-11-12 |
| `black-forest-labs.svg` | `https://bfl.ai/icon0.svg` | 2026-11-12 |
| `xai.png` | `https://x.ai/icon.png` | 2026-11-12 |
| `leonardo.png` | `https://leonardo.ai/images/leonardo_favicon.png` | 2026-11-18 |

`alibaba.svg` is the Alibaba Cloud mark — Simple Icons has no separate Alibaba
(Qwen / Wan) entry.

`leonardo.png` is published light-on-black, so both renderers invert it to sit
on the same white tile as the others — the file is greyscale, so the plate
inverts to white and disappears into the tile. The documented icon paths
(`/favicon.ico`, `/icon.svg`) still 404; this one is the favicon the site
declares in its own `<head>`.

Every provider in the catalog has a mark as of 2026-11-18. Anything added
without one falls back to a tinted monogram in `provider-mark.tsx` rather than
borrowing a wrong logo.

Marks are rendered through `<img>`, which disables scripting inside an SVG, so
a vendored file cannot execute in the page.
