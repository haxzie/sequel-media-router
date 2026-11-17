import { notFound } from 'next/navigation';
import { DocsShell } from '@/components/docs/shell';
import { DOC_PAGES, pageTitle } from '@/components/docs/nav';
import { GettingStarted } from '@/components/docs/pages/getting-started';
import { Concepts, Files, Generate, Search, Tasks } from '@/components/docs/pages/guides';
import { ApiReference, McpReference, SdkReference } from '@/components/docs/pages/reference';
import { baseUrl } from '@/lib/forge';

export const dynamic = 'force-dynamic';

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

  const mcpUrl = `${baseUrl()}/api/mcp`;

  return (
    <DocsShell slug={slug}>
      {slug === '' && <GettingStarted mcpUrl={mcpUrl} />}
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
