import { resolveActor } from '@/lib/actor';
import { requireActor } from '@/lib/guard';
import { getForge } from '@/lib/forge';
import type { TaskStatus } from '@sequel/core';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const forge = getForge();
  const url = new URL(request.url);
  const status = url.searchParams.getAll('status') as TaskStatus[];

  /*
   * `start` and `end` are independent: either can be omitted. No `end` is a
   * live range, which is what the dashboard asks for. Anything unparseable is
   * dropped rather than rejected — a bad bound should not turn a list request
   * into an error, and silently widening is safe where silently narrowing
   * would hide runs.
   */
  const start = isoOrUndefined(url.searchParams.get('start'));
  const end = isoOrUndefined(url.searchParams.get('end'));
  const userId = url.searchParams.get('user_id') ?? undefined;
  const models = url.searchParams.getAll('model');

  /*
   * Scoped to the caller's organisation, from their credential — never from a
   * query parameter, which would let anyone read another team's runs.
   * Without a credential there is no scope, so the list is empty rather than
   * everything.
   */
  const actor = await resolveActor(request);
  if (!actor?.organizationId) return Response.json({ tasks: [], modelFacets: [] });

  /*
   * Facets are computed over the same scope *minus* the model filter, so the
   * option list does not shrink as you select from it — a filter that deletes
   * its own choices cannot be undone without clearing it.
   */
  const facetScope = {
    status: status.length ? status : undefined,
    limit: 500,
    organizationId: actor.organizationId,
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(userId ? { user_id: userId } : {}),
  };
  const counts = new Map<string, number>();
  for (const task of (await forge.listTasks(facetScope)).tasks) {
    counts.set(task.model, (counts.get(task.model) ?? 0) + 1);
  }
  const modelFacets = [...counts.entries()]
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count || a.model.localeCompare(b.model));

  const page = await forge.listTasks({
    status: status.length ? status : undefined,
    limit: 100,
    organizationId: actor.organizationId,
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(userId ? { user_id: userId } : {}),
    ...(models.length ? { models } : {}),
  });

  return Response.json({ ...page, modelFacets });
}

function isoOrUndefined(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Run a model from the control panel. Same path the MCP `run_models` tool takes. */
export async function POST(request: Request) {
  const forge = getForge();
  const body = (await request.json()) as { model?: string; input?: Record<string, unknown> };
  if (!body.model) return Response.json({ error: 'model is required' }, { status: 400 });

  // Running a model spends money, so it is not anonymous.
  const gate = await requireActor(request);
  if ('response' in gate) return gate.response;

  try {
    return Response.json(
      await forge.runModel({
        model: body.model,
        input: body.input ?? {},
        createdBy: gate.actor,
      }),
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
