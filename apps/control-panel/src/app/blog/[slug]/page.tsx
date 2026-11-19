import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleToc } from '@/components/blog/article-toc';
import { Arcs, Wordmark } from '@/components/landing/mark';
import { Crumbs, Pill } from '@/components/landing/parts';
import { SiteHeader } from '@/components/landing/site-header';
import { allPosts, formatDate, postBySlug } from '@/lib/blog';
import { baseUrl } from '@/lib/forge';

/**
 * One article.
 *
 * Statically generated, because the body is read off disk and there is no
 * disk in a Worker at request time. `generateStaticParams` is what moves
 * that read to the build.
 */
export function generateStaticParams() {
  return allPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return {};

  /* One card per post, built by scripts/build-og.mjs from this frontmatter. */
  const og = `/og/blog/${post.slug}.png`;
  const url = `/blog/${post.slug}`;

  return {
    title: `${post.title} — Sequel`,
    description: post.description,
    authors: [{ name: post.author }],
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: og, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [og],
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();

  const site = baseUrl();
  const url = `${site}/blog/${post.slug}`;

  /*
   * Two documents rather than one. A BlogPosting with a nested FAQ is read
   * by Google as the article's own content; a separate FAQPage is what it
   * looks for when deciding whether to show the questions in the result.
   */
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: [`${site}${post.cover}`],
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      author: { '@type': 'Person', name: post.author },
      publisher: {
        '@type': 'Organization',
        name: 'Sequel',
        logo: { '@type': 'ImageObject', url: `${site}/sequel-mark.svg` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      keywords: post.tags.join(', '),
      wordCount: post.readingMinutes * 200,
    },
    ...(post.faq.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: post.faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <script
        type="application/ld+json"
        // Our own frontmatter, serialised by us — never a reader's input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Arcs className="pointer-events-none absolute right-[-15vw] top-0 hidden h-[62vw] w-[62vw] text-[var(--color-text)] opacity-[0.05] lg:block" />

      <SiteHeader />

      <div className="relative mx-auto max-w-[1180px] px-6">
        <article className="pt-12 sm:pt-16">
          <Crumbs
            trail={[
              { label: 'Sequel', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: post.title },
            ]}
          />

          <header className="mt-6 max-w-[42rem]">
            <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--color-dim)]">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>·</span>
              <span>{post.readingMinutes} min read</span>
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-[clamp(1.9rem,4vw,2.8rem)] font-normal leading-[1.12] tracking-[-0.02em] text-[var(--color-text)]">
              {post.title}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-[var(--color-muted)]">
              {post.description}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-card)] text-[13px] text-[var(--color-text)]">
                {post.author.slice(0, 1)}
              </span>
              <span>
                <span className="block text-[13.5px] text-[var(--color-text)]">{post.author}</span>
                {post.authorTitle && (
                  <span className="block text-[12.5px] text-[var(--color-dim)]">
                    {post.authorTitle}
                  </span>
                )}
              </span>
            </div>
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover}
            alt={post.coverAlt}
            className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover"
          />

          <div className="mt-12 flex gap-12">
            {/* The prose scope and the CTA are siblings, not nested: `.doc a`
                sets link colour by element, which beats a utility class and
                was painting the solid pill's label white on white. */}
            <div className="min-w-0 flex-1 pb-16">
              <div className="doc article">
                <div dangerouslySetInnerHTML={{ __html: post.html }} />

                {post.faq.length > 0 && (
                  <section className="mt-16">
                    <h2 id="faq">Questions</h2>
                    <div className="mt-6 space-y-3">
                      {post.faq.map((item) => (
                        <details
                          key={item.question}
                          className="group rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                        >
                          <summary className="cursor-pointer list-none text-[15px] text-[var(--color-text)] marker:hidden">
                            {item.question}
                          </summary>
                          <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
                            {item.answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
                <p className="text-[16px] text-[var(--color-text)]">
                  Every model in one connection.
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
                  Image, video and audio, from the agent you already use.
                </p>
                <div className="mt-5">
                  <Pill href="/docs">Get started</Pill>
                </div>
              </div>
            </div>

            <ArticleToc headings={[...post.headings, ...(post.faq.length ? [{ id: 'faq', text: 'Questions', level: 2 as const }] : [])]} />
          </div>
        </article>

        <footer className="flex items-center justify-between border-t border-[var(--color-line)] py-8 text-[13px] text-[var(--color-dim)]">
          <Link href="/">
            <Wordmark className="text-[var(--color-muted)]" />
          </Link>
          <Link href="/blog" className="transition-colors hover:text-[var(--color-text)]">
            All posts
          </Link>
        </footer>
      </div>
    </div>
  );
}
