import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

/** All models, for the Models page. `?q=` and `?type=` run the same search the MCP tool does. */
export async function GET(request: Request) {
  const forge = getForge();
  await forge.ready();

  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const type = url.searchParams.get('type');

  if (query || type) {
    const out = await forge.searchModels({
      query: query ?? undefined,
      type: (type as 'image' | 'video' | 'audio' | null) ?? undefined,
      includeDisabled: true,
      // The page filters ranked results by tab in the browser, so a server-side
      // cut would silently empty a tab once the catalog outgrows the limit.
      limit: 200,
    });
    return Response.json(out);
  }

  return Response.json({ models: await forge.listAllModels(), mode: 'all' });
}

/** Toggle a model on or off. */
export async function PATCH(request: Request) {
  const forge = getForge();
  const { id, enabled } = (await request.json()) as { id?: string; enabled?: boolean };
  if (!id || typeof enabled !== 'boolean') {
    return Response.json({ error: 'Body must be { id: string, enabled: boolean }' }, { status: 400 });
  }
  try {
    await forge.setModelEnabled(id, enabled);
    return Response.json({ ok: true, id, enabled });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 404 },
    );
  }
}
