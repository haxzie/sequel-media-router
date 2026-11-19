import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The docs' on-page contents, read out of the page sources at build time.
 *
 * The rail used to scrape `document.querySelectorAll('.doc h2[id]')` after
 * hydration, which meant the contents did not exist in the HTML: not for a
 * crawler, not for a reader with JavaScript off, and not until the page had
 * already painted once without them.
 *
 * A declared list per page would fix that and rot instead — two places to
 * change a heading, one of which nobody remembers. So the headings come
 * from the only copy that has to be right: the JSX that renders them.
 *
 * This reads source files with `node:fs`, so like the blog it only works
 * during the build. Every docs route is statically generated, which is what
 * keeps that true.
 */

export interface DocHeading {
  id: string;
  text: string;
}

const DIR = join(process.cwd(), 'src', 'components', 'docs', 'pages');

/** `&rsquo;` and friends, which are in the source but not in a heading. */
function decode(text: string): string {
  return text
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/\{'\s*'\}/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let cache: Map<string, DocHeading[]> | undefined;

/**
 * Splits each file on its exported components, so one module holding five
 * pages yields five separate lists rather than one merged one.
 */
function index(): Map<string, DocHeading[]> {
  if (cache) return cache;
  cache = new Map();

  for (const file of readdirSync(DIR)) {
    if (!file.endsWith('.tsx')) continue;
    const source = readFileSync(join(DIR, file), 'utf8');

    const components = [...source.matchAll(/export function (\w+)\(/g)];
    for (const [index_, match] of components.entries()) {
      const name = match[1]!;
      const from = match.index!;
      const to = components[index_ + 1]?.index ?? source.length;

      const headings = [...source.slice(from, to).matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)]
        .map(([, id, text]) => ({ id: id!, text: decode(text!) }))
        .filter((heading) => heading.text.length > 0);

      if (headings.length > 0) cache.set(name, headings);
    }
  }

  return cache;
}

export function headingsFor(component: string): DocHeading[] {
  return index().get(component) ?? [];
}
