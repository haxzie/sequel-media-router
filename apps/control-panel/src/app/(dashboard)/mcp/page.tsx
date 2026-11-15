import { PageHeader } from '@sequel/ui';
import { getForge } from '@/lib/forge';

export const metadata = { title: 'MCP Server — Sequel' };
export const dynamic = 'force-dynamic';

export default async function McpPage() {
  const forge = getForge();
  const models = await forge.listAllModels();
  const enabled = models.filter((model) => model.enabled).length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'MCP Server']}
        title="MCP Server"
        meta={
          <>
            {models.length} models · {enabled} enabled · one endpoint for image, video and audio
          </>
        }
      />
    </div>
  );
}
