# MCP client brand marks

Used only to identify each client in the install list. Each mark is the
trademark of its owner; none of them endorse this project.

All from [Simple Icons](https://simpleicons.org) (CC0-1.0 for the collection;
the marks themselves remain trademarks), retrieved 2026-11-15.

| File | Simple Icons slug |
| --- | --- |
| `claude.svg` | `claude` |
| `claude-code.svg` | `claudecode` |
| `cursor.svg` | `cursor` |
| `vscode.svg` | `visualstudiocode` |
| `chatgpt.svg` | `openai` |
| `gemini.svg` | `googlegemini` |
| `typescript.svg` | `typescript` (2026-11-18) |
| `bun.svg` | `bun` (2026-11-18) |
| `nextjs.svg` | `nextdotjs` (2026-11-18) |

`codex.svg` and `muse.svg` come from LobeHub's static icon set
(`@lobehub/icons-static-svg`, retrieved 2026-11-19); Simple Icons has no entry
for either, and OpenAI's logo is the wrong mark for Codex.

`grok-bot.svg` was supplied directly (2026-11-19). It is a filled disc with
the glyph cut out of it, so unlike the others it reads as a light avatar on
the tile rather than a glyph on a brand colour.

Claude Code has its own mark now; it was sharing Claude's.

TypeScript, Bun and Next.js are not MCP clients. They sit in the docs' two
doors, as the stack the SDK half is written for, and they use the same tiles
as the clients above — hence the same folder.

Marks render as a CSS mask filled white over a brand-coloured tile, so each
file needs to be a single-colour glyph. Brand hexes live in
`components/mcp/clients.ts`.
