import { getForge } from '@/lib/forge';
import { requireActor } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // An upload URL is write access to our bucket.
  const gate = await requireActor(request);
  if ('response' in gate) return gate.response;

  const { content_type, extension } = (await request.json()) as {
    content_type?: string;
    extension?: string;
  };
  if (!content_type) {
    return Response.json({ error: 'content_type is required' }, { status: 400 });
  }
  return Response.json(await getForge().getUploadUrl({ content_type, extension }));
}
