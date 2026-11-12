/**
 * Upload URLs and result storage.
 *
 * `get_upload_url` hands back two URLs: one to PUT the bytes to, and one the
 * model will later read them from. With R2 configured those are a presigned S3
 * URL and the bucket's public URL. Without it, both point at the app's own
 * `/api/files` route backed by local disk, so the POC runs on a fresh clone.
 */
import { AwsClient } from 'aws4fetch';
import type { Asset } from './types';

export interface UploadTarget {
  /** Opaque key the caller passes back as `file_url` when running a model. */
  key: string;
  /** PUT the bytes here. Expires. */
  uploadUrl: string;
  /** Where the file will be readable once uploaded. */
  fileUrl: string;
  expiresInSeconds: number;
  /** `r2` or `local` — tells the caller what they are talking to. */
  driver: 'r2' | 'local';
}

export interface StorageConfig {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Public base URL for reads: an r2.dev domain or a custom domain. */
  publicBaseUrl: string;
}

export interface Uploads {
  createUploadUrl(opts: { contentType: string; extension?: string }): Promise<UploadTarget>;
  /** Persist bytes we produced ourselves (a model returned binary, not a link). */
  put(opts: { bytes: ArrayBuffer; mime: string; ext: string }): Promise<Asset>;
}

function randomKey(ext: string): string {
  const id = crypto.randomUUID().replace(/-/g, '');
  return `${new Date().toISOString().slice(0, 10)}/${id}${ext ? `.${ext}` : ''}`;
}

/** R2 over its S3-compatible API. `aws4fetch` signs; it works on Workers and Node. */
export class R2Uploads implements Uploads {
  private readonly client: AwsClient;
  private readonly endpoint: string;

  constructor(private readonly config: StorageConfig) {
    this.client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: 's3',
      region: 'auto',
    });
    this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}`;
  }

  static fromEnv(env: Record<string, string | undefined> = process.env): R2Uploads | null {
    const {
      CLOUDFLARE_ACCOUNT_ID: accountId,
      R2_BUCKET: bucket,
      R2_ACCESS_KEY_ID: accessKeyId,
      R2_SECRET_ACCESS_KEY: secretAccessKey,
      R2_PUBLIC_BASE_URL: publicBaseUrl,
    } = env;
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) return null;
    return new R2Uploads({ accountId, bucket, accessKeyId, secretAccessKey, publicBaseUrl });
  }

  async createUploadUrl(opts: { contentType: string; extension?: string }): Promise<UploadTarget> {
    const key = randomKey(opts.extension ?? '');
    const expiresInSeconds = 900;
    const url = new URL(`${this.endpoint}/${key}`);
    url.searchParams.set('X-Amz-Expires', String(expiresInSeconds));

    const signed = await this.client.sign(
      new Request(url, { method: 'PUT', headers: { 'content-type': opts.contentType } }),
      { aws: { signQuery: true } },
    );

    return {
      key,
      uploadUrl: signed.url,
      fileUrl: `${this.config.publicBaseUrl.replace(/\/$/, '')}/${key}`,
      expiresInSeconds,
      driver: 'r2',
    };
  }

  async put(opts: { bytes: ArrayBuffer; mime: string; ext: string }): Promise<Asset> {
    const key = randomKey(opts.ext);
    const res = await this.client.fetch(`${this.endpoint}/${key}`, {
      method: 'PUT',
      body: opts.bytes,
      headers: { 'content-type': opts.mime },
    });
    if (!res.ok) throw new Error(`R2 PUT failed: ${res.status} ${await res.text()}`);
    return {
      url: `${this.config.publicBaseUrl.replace(/\/$/, '')}/${key}`,
      mime: opts.mime,
      bytes: opts.bytes.byteLength,
      key,
    };
  }
}

/**
 * Local-disk fallback. Writes under `.data/files` and serves through the app's
 * `/api/files/[...key]` route. Enough to exercise the whole flow offline.
 */
export class LocalUploads implements Uploads {
  constructor(
    private readonly dir: string,
    private readonly baseUrl: string,
  ) {}

  async createUploadUrl(opts: { contentType: string; extension?: string }): Promise<UploadTarget> {
    const key = randomKey(opts.extension ?? '');
    const base = this.baseUrl.replace(/\/$/, '');
    return {
      key,
      // The same route accepts PUT and serves GET, so one URL does both jobs.
      uploadUrl: `${base}/api/files/${key}`,
      fileUrl: `${base}/api/files/${key}`,
      expiresInSeconds: 3600,
      driver: 'local',
    };
  }

  async put(opts: { bytes: ArrayBuffer; mime: string; ext: string }): Promise<Asset> {
    const key = randomKey(opts.ext);
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { join, dirname } = await import('node:path');
    const target = join(this.dir, key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(opts.bytes));
    return {
      url: `${this.baseUrl.replace(/\/$/, '')}/api/files/${key}`,
      mime: opts.mime,
      bytes: opts.bytes.byteLength,
      key,
    };
  }
}
