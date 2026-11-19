import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { highlight } from 'sugar-high';
import { lang as resolveLang } from 'sugar-high/lang';

/**
 * The blog, read off disk at build time.
 *
 * Posts are markdown files in `content/blog`, parsed here rather than kept
 * in a CMS: the set is small, writing one is a pull request, and the whole
 * thing survives the app being redeployed anywhere.
 *
 * `node:fs` is the reason every blog route is statically generated. There is
 * no filesystem in a Worker at request time, so these functions must only
 * ever run during the build — which is what `generateStaticParams` plus a
 * static page gives us. A `force-dynamic` on a blog route would pass
 * typecheck, pass locally under `next dev`, and 500 in production.
 */

const DIR = join(process.cwd(), 'content', 'blog');

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  author: string;
  /** Short line under the author on the post page. */
  authorTitle?: string;
  date: string;
  updated?: string;
  cover: string;
  coverAlt: string;
  tags: string[];
  faq: FaqItem[];
  readingMinutes: number;
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface Post extends PostMeta {
  html: string;
  headings: Heading[];
}

/** `A Title: With Punctuation!` → `a-title-with-punctuation`. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function readingMinutes(markdown: string): number {
  /* 200wpm, floored at one — "0 min read" is worse than slightly wrong. */
  return Math.max(1, Math.round(markdown.split(/\s+/).length / 200));
}

/**
 * Renders the body and collects its headings in one pass.
 *
 * The ids have to match between the rail and the document, so both come from
 * the same walk rather than from the rail re-deriving them from the DOM.
 */
function render(markdown: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];

  const renderer = new marked.Renderer();
  renderer.heading = function heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const plain = text.replace(/<[^>]+>/g, '');
    const id = slugify(plain);
    if (depth === 2 || depth === 3) headings.push({ id, text: plain, level: depth });
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  /* Same highlighter as the docs, run here at build time — a post is static,
     so there is no reason to ship a tokeniser to the reader for it. */
  renderer.code = ({ text, lang }) => {
    const label = lang || 'ts';
    const body = highlight(text, { lang: resolveLang(label) });
    return `<figure class="code-block"><figcaption>${label}</figcaption><pre>${body}</pre></figure>`;
  };

  const html = marked.parse(markdown, { renderer, async: false }) as string;
  return { html, headings };
}

function parse(file: string): Post {
  const slug = file.replace(/\.md$/, '');
  const raw = readFileSync(join(DIR, file), 'utf8');
  const { data, content } = matter(raw);

  for (const required of ['title', 'description', 'author', 'date', 'cover'] as const) {
    if (!data[required]) throw new Error(`content/blog/${file} is missing \`${required}\``);
  }

  const { html, headings } = render(content);

  return {
    slug,
    title: data.title,
    description: data.description,
    author: data.author,
    authorTitle: data.authorTitle,
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date),
    updated: data.updated
      ? data.updated instanceof Date
        ? data.updated.toISOString().slice(0, 10)
        : String(data.updated)
      : undefined,
    cover: data.cover,
    coverAlt: data.coverAlt ?? '',
    tags: data.tags ?? [],
    faq: data.faq ?? [],
    readingMinutes: readingMinutes(content),
    html,
    headings,
  };
}

/** Newest first. */
export function allPosts(): Post[] {
  return readdirSync(DIR)
    .filter((file) => file.endsWith('.md'))
    .map(parse)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function postBySlug(slug: string): Post | undefined {
  return allPosts().find((post) => post.slug === slug);
}

/** Long form, for the byline. Fixed locale so the server and client agree. */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
