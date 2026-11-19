import Link from 'next/link';
import { Arcs, Wordmark } from '@/components/landing/mark';
import { SiteHeader } from '@/components/landing/site-header';
import { Duo } from '@/components/landing/parts';
import { allPosts, formatDate } from '@/lib/blog';

export const metadata = {
  title: 'Blog — Sequel',
  description: 'Notes on building with generative media models: what breaks, what it costs, and what to write instead.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — Sequel',
    description: 'Notes on building with generative media models.',
    type: 'website',
    url: '/blog',
  },
};

/**
 * The index. Posts are read off disk, so this is generated at build time —
 * see lib/blog.ts for why that is not optional.
 */
export default function BlogIndex() {
  const posts = allPosts();

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Arcs className="pointer-events-none absolute right-[-15vw] top-0 hidden h-[62vw] w-[62vw] text-[var(--color-text)] opacity-[0.07] lg:block" />

      <SiteHeader />

      <div className="relative mx-auto max-w-[1180px] px-6">
        <section className="pt-14 sm:pt-20">
          <Duo
            lead="Director's commentary"
            tail="what breaks, what it costs, and what to write instead"
            className="text-[clamp(1.8rem,3.6vw,2.6rem)]"
          />
        </section>

        <section className="grid gap-6 py-12 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl transition-colors hover:border-white/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover}
                alt={post.coverAlt}
                className="aspect-[16/9] w-full object-cover"
              />

              <div className="p-5">
                <div className="flex items-center gap-2 text-[12px] text-[var(--color-dim)]">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span>·</span>
                  <span>{post.readingMinutes} min read</span>
                </div>

                <h2 className="mt-2.5 text-[19px] leading-snug tracking-tight text-[var(--color-text)]">
                  {post.title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
                  {post.description}
                </p>
                <p className="mt-4 text-[13px] text-[var(--color-dim)]">{post.author}</p>
              </div>
            </Link>
          ))}
        </section>

        <footer className="flex items-center justify-between border-t border-[var(--color-line)] py-8 text-[13px] text-[var(--color-dim)]">
          <Link href="/">
            <Wordmark className="text-[var(--color-muted)]" />
          </Link>
          <Link href="/docs" className="transition-colors hover:text-[var(--color-text)]">
            Docs
          </Link>
        </footer>
      </div>
    </div>
  );
}
