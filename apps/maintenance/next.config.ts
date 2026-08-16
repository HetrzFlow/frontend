import path from 'path';
import { withI18n } from '@repo/i18n/config/next';

import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = withI18n({
  //  build in production
  ...(isProduction ? { distDir: 'build' } : {}),
  output: 'export',
  transpilePackages: ['@repo/ui', '@repo/i18n', '@repo/common'],
  reactCompiler: true,
  webpack: (config) => {
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};

    Object.assign(config.resolve.alias, {
      '@/locales': path.resolve(__dirname, './locales'),
      '@/': path.resolve(__dirname, './src'),
    });

    return config;
  },
});

export default nextConfig;
