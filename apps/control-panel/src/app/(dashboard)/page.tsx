import { Card, PageHeader } from '@sequel/ui';
import Link from 'next/link';
import { getForge } from '@/lib/forge';

export const metadata = { title: 'Create — Sequel' };
export const dynamic = 'force-dynamic';

/**
 * Create does not exist yet.
 *
 * The MCP page moved out from under this route, so rather than leave the
 * landing page blank it says plainly what is not built and points at the two
 * surfaces that do run a model today. A page that implies a composer exists
 * would cost someone more time than an empty one.
 */
export default async function CreatePage() {
  const forge = getForge();
  const models = await forge.listAllModels();
  const enabled = models.filter((model) => model.enabled).length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'Create']}
        title="Create"
        meta={<>{enabled} models ready to run</>}
      />

      <Card className="px-6 py-10 text-center">
        <div className="text-[15px] text-[var(--color-text)]">
          There is no composer here yet
        </div>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--color-muted)]">
          Generating from the dashboard is not built. Models run through the MCP server or by
          POSTing to <code className="font-mono text-[12px]">/api/tasks</code>, and the results
          land in Tasks either way.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            href="/mcp"
            className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90"
          >
            MCP Server
          </Link>
          <Link
            href="/models"
            className="rounded-full border border-[var(--color-line-strong)] px-4 py-2 text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Browse models
          </Link>
        </div>
      </Card>
    </div>
  );
}
