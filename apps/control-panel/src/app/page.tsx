import { getForge, baseUrl, hasCredentials } from '@/lib/forge';
import { CopyField } from '@/components/copy-field';
import { Card, Eyebrow, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

const TOOLS = [
  ['search_models', 'Find models by use case or name. Returns capabilities, price and outline.'],
  ['get_model_schemas', 'Full JSON Schema for a model’s input, plus its published rates.'],
  ['get_upload_url', 'A URL to PUT a file to, and the URL it will be readable from.'],
  ['run_models', 'Run a model. Image and audio inline; video returns in_progress.'],
  ['list_tasks', 'Status, results and cost for recent runs.'],
] as const;

const TONES = ['periwinkle', 'sky', 'pink'] as const;

export default async function HomePage() {
  const forge = getForge();
  const models = await forge.listAllModels();
  const url = `${baseUrl()}/api/mcp`;

  const counts = models.reduce<Record<string, number>>((acc, model) => {
    acc[model.modality] = (acc[model.modality] ?? 0) + 1;
    return acc;
  }, {});
  const enabled = models.filter((model) => model.enabled).length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumb={['Sequel', 'Home']}
        title="MCP server"
        meta={
          <>
            {models.length} models · {enabled} enabled · one endpoint for image, video and audio
          </>
        }
      />

      {!hasCredentials() && (
        <Card className="mb-8 px-5 py-4">
          <div className="flex gap-3">
            <span className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--color-pink)]" />
            <div className="text-[13px] leading-relaxed text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-text)]">
                No Cloudflare credentials.
              </span>{' '}
              Set <code className="font-mono text-[12px]">CLOUDFLARE_ACCOUNT_ID</code> and{' '}
              <code className="font-mono text-[12px]">CLOUDFLARE_API_TOKEN</code> in{' '}
              <code className="font-mono text-[12px]">.env.local</code>. The panel runs and search
              falls back to keywords, but every run will fail until they are set.
            </div>
          </div>
        </Card>
      )}

      <section className="mb-8">
        <Eyebrow className="mb-3">Server URL</Eyebrow>
        <CopyField value={url} />
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">
          Streamable HTTP. Add it to Claude Code with{' '}
          <code className="font-mono text-[12px] text-[var(--color-text)]">
            claude mcp add --transport http sequel {url}
          </code>
        </p>
      </section>

      <section className="mb-8 grid grid-cols-3 gap-4">
        {(['image', 'video', 'audio'] as const).map((modality, index) => (
          <Card key={modality} tone={TONES[index]} className="px-5 py-5">
            <div className="text-[12px] font-medium uppercase tracking-[0.08em] opacity-60">
              {modality}
            </div>
            <div className="display nums mt-4 text-[40px] leading-none">
              {counts[modality] ?? 0}
            </div>
            <div className="mt-1 text-[13px] opacity-60">models available</div>
          </Card>
        ))}
      </section>

      <section>
        <Eyebrow className="mb-3">Tools exposed</Eyebrow>
        <Card className="overflow-hidden">
          {TOOLS.map(([name, description], index) => (
            <div
              key={name}
              className={[
                'px-5 py-4',
                index > 0 ? 'border-t border-[var(--color-line)]' : '',
              ].join(' ')}
            >
              <code className="font-mono text-[13px] text-[var(--color-text)]">{name}</code>
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">{description}</p>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
