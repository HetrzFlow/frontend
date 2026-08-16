import path from 'path';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { withI18n } from '@repo/i18n/config/next';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = withI18n({
  assetPrefix: '/trade-static',
  transpilePackages: ['@repo/ui', '@repo/i18n'],
  reactCompiler: true,
  experimental: {
    globalNotFound: true,
  },
  webpack: (config) => {
    if (config.resolve.alias) {
      Object.assign(config.resolve.alias, {
        '@/locales': path.resolve(__dirname, './locales'),
        '@/': path.resolve(__dirname, './src'),
      });
    }

    return config;
  },
  redirects: async () => {
    const localesStr = linguiConfig.locales.join('|');

    return [
      {
        source: `/:locale(${localesStr})`,
        destination: '/:locale/trade',
        permanent: true, // code: 301
      },
      {
        source: '/',
        destination: '/trade',
        permanent: true, // code: 301
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `object-src 'none';frame-ancestors 'self' ${process.env.NEXT_PUBLIC_HOME_URL} ${process.env.VERCEL_ENV === 'preview' ? 'http://localhost:*' : ''};`,
          },
        ],
      },
    ];
  },
});

export default nextConfig;
