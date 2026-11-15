import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Workspace packages ship TypeScript source, so Next compiles them in place.
  transpilePackages: ['@sequel/core', '@sequel/models', '@sequel/ui'],
  eslint: { ignoreDuringBuilds: true },
};

// Gives `next dev` the real Cloudflare bindings (D1 here) through miniflare,
// so development and the Workers runtime read the same database shape rather
// than diverging behind a mock.
void initOpenNextCloudflareForDev();

export default config;
