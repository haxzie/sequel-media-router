import { resolveActor } from '@/lib/actor';
import { getForge } from '@/lib/forge';
import type { TaskStatus } from '@sequel/core';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const forge = getForge();
  const url = new URL(request.url);
  const status = url.searchParams.getAll('status') as TaskStatus[];
  return Response.json(
    await forge.listTasks({ status: status.length ? status : undefined, limit: 100 }),
  );
}

/** Run a model from the control panel. Same path the MCP `run_models` tool takes. */
export async function POST(request: Request) {
  const forge = getForge();
  const body = (await request.json()) as { model?: string; input?: Record<string, unknown> };
  if (!body.model) return Response.json({ error: 'model is required' }, { status: 400 });

  try {
    const createdBy = await resolveActor(request);
    return Response.json(
      await forge.runModel({
        model: body.model,
        input: body.input ?? {},
        ...(createdBy ? { createdBy } : {}),
      }),
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
