/**
 * Builds public/og.png — the card every link to this site unfurls as.
 *
 *   FONTCONFIG_FILE=… node scripts/build-og.mjs   (the script sets it itself)
 *
 * Baked rather than rendered per request: the card never varies by page, and
 * an ImageResponse would put a font loader and a rasteriser in the request
 * path to produce the same bytes every time. Re-run this when the wordmark,
 * the arcs or the line change.
 *
 * Inter is not a system font, so the script fetches it once into a cache dir
 * and points fontconfig at it — librsvg only sees installed families, and
 * silently substitutes something else when it cannot find one. Checking that
 * substitution has not happened is the one thing worth doing by eye after a
 * rebuild.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'public', 'og.png');
const BLOG_DIR = join(here, '..', 'content', 'blog');
const BLOG_OUT = join(here, '..', 'public', 'og', 'blog');
const FONT_DIR = join(tmpdir(), 'sequel-og-fonts');
const FONT_SOURCE = 'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files';
const FACES = ['Inter-Bold.otf', 'Inter-Regular.otf', 'Inter-Medium.otf'];

const W = 1200;
const H = 630;

/* The brand mark, from components/landing/mark.tsx, on its 24 grid. */
const MARK =
  'M12 4c6.075 0 11 4.925 11 11v5h-2v-5a9 9 0 0 0-8.735-8.996L12 6a9 9 0 0 0-8.996 8.735L3 15v5H1v-5C1 8.925 5.925 4 12 4m0 4a7 7 0 0 1 7 7v5h-2v-5a5 5 0 0 0-4.783-4.995L12 10a5 5 0 0 0-4.995 4.783L7 15v5H5v-5a7 7 0 0 1 7-7m0 4a3 3 0 0 1 3 3v5h-2v-5a1 1 0 0 0-.883-.993L12 14a1 1 0 0 0-.993.883L11 15v5H9v-5a3 3 0 0 1 3-3';

async function fonts() {
  mkdirSync(FONT_DIR, { recursive: true });
  mkdirSync(join(FONT_DIR, 'cache'), { recursive: true });

  for (const face of FACES) {
    const path = join(FONT_DIR, face);
    if (existsSync(path)) continue;
    const res = await fetch(`${FONT_SOURCE}/${face}`);
    if (!res.ok) throw new Error(`could not fetch ${face}: ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }

  const conf = join(FONT_DIR, 'fonts.conf');
  writeFileSync(
    conf,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <dir>/System/Library/Fonts</dir>
  <dir>/System/Library/Fonts/Supplemental</dir>
  <dir>/usr/share/fonts</dir>
  <cachedir>${join(FONT_DIR, 'cache')}</cachedir>
</fontconfig>
`,
  );
  return conf;
}

/**
 * Wraps on width rather than on word count: at 80px in Inter a line holds
 * roughly 26 characters before it reaches the arcs, and a title broken at
 * "the" looks like a bug.
 */
function wrap(text, perLine = 26, max = 3) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length > max ? [...lines.slice(0, max - 1), `${lines[max - 1]}…`] : lines;
}

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The shared furniture: plate, arcs, wordmark. */
function frame(inner) {
  const arcs = [640, 520, 400]
    .map(
      (r) =>
        `<path d="M${W - r} 0A${r} ${r} 0 0 0 ${W} ${r}" stroke="#fafafa" stroke-width="36" fill="none" opacity="0.07"/>`,
    )
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  ${arcs}

  <g transform="translate(72, 64) scale(1.5)">
    <path d="${MARK}" fill="#fafafa"/>
  </g>
  <text x="112" y="92" font-family="Inter" font-size="30" font-weight="500" fill="#fafafa" letter-spacing="-0.4">Sequel</text>
  ${inner}
</svg>`;
}

/**
 * A card per post, from its own frontmatter — the title, who wrote it, and
 * how long it takes to read. Parsed with a few regexes rather than a YAML
 * dependency, because this script only ever reads fields it also writes.
 */
function postCards() {
  if (!existsSync(BLOG_DIR)) return [];
  mkdirSync(BLOG_OUT, { recursive: true });

  return readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(BLOG_DIR, file), 'utf8');
      const front = raw.split('---')[1] ?? '';
      const field = (name) =>
        (front.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1] ?? '')
          .trim()
          .replace(/^['"]|['"]$/g, '');

      const title = field('title');
      if (!title) return null;

      const lines = wrap(title);
      const top = 300 - (lines.length - 1) * 46;
      const body = lines
        .map(
          (line, i) =>
            `<text x="72" y="${top + i * 92}" font-family="Inter" font-size="76" font-weight="400" fill="#fafafa" letter-spacing="-1.6">${escape(line)}</text>`,
        )
        .join('\n  ');

      const byline = [field('author'), field('date')].filter(Boolean).join(' · ');

      return {
        out: join(BLOG_OUT, `${file.replace(/\.md$/, '')}.png`),
        svg: frame(`${body}
  <text x="72" y="536" font-family="Inter" font-size="26" font-weight="400" fill="#8f8f8f" letter-spacing="-0.3">${escape(byline)}</text>`),
      };
    })
    .filter(Boolean);
}

function card() {
  /* The same arcs the site draws: concentric quarters centred on the top
     right corner, entering at the top edge and leaving through the right. */
  const arcs = [640, 520, 400]
    .map(
      (r) =>
        `<path d="M${W - r} 0A${r} ${r} 0 0 0 ${W} ${r}" stroke="#fafafa" stroke-width="36" fill="none" opacity="0.07"/>`,
    )
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  ${arcs}

  <g transform="translate(72, 64) scale(1.5)">
    <path d="${MARK}" fill="#fafafa"/>
  </g>
  <text x="112" y="92" font-family="Inter" font-size="30" font-weight="500" fill="#fafafa" letter-spacing="-0.4">Sequel</text>

  <!-- 400, not 700: <Duo> on the site is font-normal with -0.02em tracking,
       and a bold card next to a light page is a different brand. -->
  <text x="72" y="344" font-family="Inter" font-size="80" font-weight="400" fill="#fafafa" letter-spacing="-1.6">Generative media</text>
  <text x="72" y="436" font-family="Inter" font-size="80" font-weight="400" fill="#8f8f8f" letter-spacing="-1.6">stack for agents</text>

  <text x="72" y="536" font-family="Inter" font-size="26" font-weight="400" fill="#8f8f8f" letter-spacing="-0.3">Image, video and audio · 100+ models · one integration</text>
</svg>`;
}

const conf = await fonts();

/*
 * Re-entered with fontconfig pointed at the cache. sharp resolves fonts when
 * its native half loads, so setting the variable in-process is too late.
 */
if (process.env.SEQUEL_OG_FONTS !== conf) {
  execFileSync(process.execPath, [fileURLToPath(import.meta.url)], {
    stdio: 'inherit',
    env: { ...process.env, FONTCONFIG_FILE: conf, SEQUEL_OG_FONTS: conf },
  });
  process.exit(0);
}

const { default: sharp } = await import('sharp');

async function emit(svg, out) {
  const png = await sharp(Buffer.from(svg), { density: 144 }).resize(W, H).png().toBuffer();
  writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}

await emit(card(), OUT);
for (const post of postCards()) await emit(post.svg, post.out);
