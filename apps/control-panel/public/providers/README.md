# Provider brand marks

Used only to identify each model's provider in the catalog. Each mark is the
trademark of its owner; none of them endorse this project.

| File | Source | Retrieved |
| --- | --- | --- |
| `google.svg`, `openai.svg`, `alibaba.svg`, `elevenlabs.svg`, `deepgram.svg`, `minimax.svg` | [Simple Icons](https://simpleicons.org) (CC0-1.0 for the collection; the marks themselves remain trademarks) | 2026-11-12 |
| `black-forest-labs.svg` | `https://bfl.ai/icon0.svg` | 2026-11-12 |
| `xai.png` | `https://x.ai/icon.png` | 2026-11-12 |

`alibaba.svg` is the Alibaba Cloud mark — Simple Icons has no separate Alibaba
(Qwen / Wan) entry.

**Leonardo has no mark.** leonardo.ai 404s every icon path and the app
subdomain rate-limits. It falls back to the tinted monogram in
`model-browser.tsx`; add `leonardo.svg` here and a line in `PROVIDER_LOGO` if a
usable asset turns up.

Marks are rendered through `<img>`, which disables scripting inside an SVG, so
a vendored file cannot execute in the page.
