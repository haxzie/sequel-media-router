import { notFound } from 'next/navigation';
import { DocsShell } from '@/components/docs/shell';
import { DOC_PAGES, pageTitle } from '@/components/docs/nav';
import { headingsFor } from '@/lib/docs-headings';
import { ForCreators, ForDevelopers } from '@/components/docs/pages/audiences';
import { GettingStarted } from '@/components/docs/pages/getting-started';
import { Concepts, Files, Generate, Search, Tasks } from '@/components/docs/pages/guides';
import { ApiReference, McpReference, SdkReference } from '@/components/docs/pages/reference';
import { baseUrl } from '@/lib/forge';

/**
 * Static. Every docs page is hand-written JSX over data that does not change
 * between requests, and its contents rail is read from the sources at build
 * time — both of which stop being possible the moment this renders per
 * request. `generateStaticParams` enumerates the routes; nothing in the tree
 * may call `headers()` or `cookies()` without undoing it.
 */
export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({ slug: page.slug ? page.slug.split('/') : [] }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return { title: `${pageTitle(slug?.join('/') ?? '')} — Sequel docs` };
}

/**
 * Every docs page, one route.
 *
 * The set is small and hand-written, so a switch is the whole router. MDX
 * would buy nothing here except a build step and a second way to write a
 * heading.
 */
export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug: segments } = await params;
  const slug = segments?.join('/') ?? '';

  if (!DOC_PAGES.some((page) => page.slug === slug)) notFound();

  const mcpUrl = `${baseUrl()}/mcp`;
  const page = DOC_PAGES.find((entry) => entry.slug === slug)!;

  return (
    <DocsShell slug={slug} headings={headingsFor(page.component)}>
      {slug === '' && <GettingStarted />}
      {slug === 'creators' && <ForCreators mcpUrl={mcpUrl} />}
      {slug === 'developers' && <ForDevelopers />}
      {slug === 'concepts' && <Concepts />}
      {slug === 'search' && <Search />}
      {slug === 'generate' && <Generate />}
      {slug === 'tasks' && <Tasks />}
      {slug === 'files' && <Files />}
      {slug === 'sdk' && <SdkReference />}
      {slug === 'api' && <ApiReference />}
      {slug === 'mcp' && <McpReference url={mcpUrl} />}
    </DocsShell>
  );
}
