/**
 * Local file driver: the same route accepts PUT and serves GET.
 *
 * Only used when R2 is not configured. Keeps the whole upload → run → fetch
 * loop working on a fresh clone with nothing but a Cloudflare API token.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { LOCAL_FILE_DIR } from '@/lib/forge';

export const dynamic = 'force-dynamic';

/** Reject anything that climbs out of the storage root. */
function resolveSafe(parts: string[]): string | null {
  const rel = normalize(parts.join('/'));
  if (rel.startsWith('..') || rel.includes('\0')) return null;
  return join(process.cwd(), LOCAL_FILE_DIR, rel);
}

export async function PUT(request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const target = resolveSafe(key);
  if (!target) return Response.json({ error: 'Invalid key' }, { status: 400 });

  const bytes = Buffer.from(await request.arrayBuffer());
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return Response.json({ ok: true, bytes: bytes.byteLength });
}

export async function GET(_request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const target = resolveSafe(key);
  if (!target) return Response.json({ error: 'Invalid key' }, { status: 400 });

  try {
    const bytes = await readFile(target);
    const ext = target.split('.').pop()?.toLowerCase() ?? '';
    const mime =
      { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
        mp4: 'video/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', opus: 'audio/opus',
        flac: 'audio/flac', aac: 'audio/aac' }[ext] ?? 'application/octet-stream';
    return new Response(new Uint8Array(bytes), {
      headers: { 'content-type': mime, 'cache-control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
}
