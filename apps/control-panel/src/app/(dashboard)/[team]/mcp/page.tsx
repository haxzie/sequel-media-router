import { CopyField, Eyebrow, PageHeader } from '@sequel/ui';
import { McpClientList } from '@/components/mcp/client-list';
import { baseUrl } from '@/lib/forge';

export const metadata = { title: 'MCP Server — Sequel' };
export const dynamic = 'force-dynamic';

export default function McpPage() {
  const url = `${baseUrl()}/mcp`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'MCP Server']}
        title="MCP Server"
        meta={
          <>
            Generate from the agent you already work in — Claude Code, Cursor, or anything that
            speaks MCP.
          </>
        }
      />

      <section className="mb-8">
        <Eyebrow className="mb-3">Server URL</Eyebrow>
        <CopyField value={url} />
      </section>

      <section>
        <Eyebrow className="mb-3">Install</Eyebrow>
        <McpClientList url={url} />
      </section>
    </div>
  );
}
