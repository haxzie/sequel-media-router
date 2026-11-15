import { PageHeader } from '@sequel/ui';

export const metadata = { title: 'MCP Server — Sequel' };

/**
 * No data read here any more, so no dynamic rendering either — the counts went
 * with the old description.
 */
export default function McpPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'MCP Server']}
        title="MCP Server"
        meta={<>Generate from the agent you already work in — Claude Code, Cursor, or anything that speaks MCP.</>}
      />
    </div>
  );
}
