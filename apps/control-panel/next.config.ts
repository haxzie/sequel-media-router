import type { NextConfig } from 'next';

const config: NextConfig = {
  // Workspace packages ship TypeScript source, so Next compiles them in place.
  transpilePackages: ['@forge/core', '@forge/models'],
  eslint: { ignoreDuringBuilds: true },
};

export default config;
