import { getForge } from '@/lib/forge';

export const dynamic = 'force-dynamic';

/**
 * A model's input schema, capabilities and rates.
 *
 * The same thing the MCP `get_model_schemas` tool returns. It existed only
 * over MCP, which meant an SDK had to speak a protocol designed for agents
 * just to find out what a parameter is called.
 *
 * Model ids contain slashes (`@cf/black-forest-labs/flux-1-schnell`), so the
 * segment arrives encoded and is decoded here rather than being split.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    return Response.json(await getForge().getModelSchemas({ model: decodeURIComponent(id) }));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 404 },
    );
  }
}
