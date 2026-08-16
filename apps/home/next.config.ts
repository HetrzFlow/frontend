import path from 'path';
import { withMicrofrontends } from '@vercel/microfrontends/next/config';
import { withI18n } from '@repo/i18n/config/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  assetPrefix: '/home-static',
  transpilePackages: ['@repo/ui', '@repo/i18n', '@/repo/common'],
  reactCompiler: true,
  experimental: {
    globalNotFound: true,
    optimizeCss: true,
    optimizePackageImports: [
      '@repo/ui',
      '@repo/common',
      'animejs',
      'gsap',
      'lottie-web',
    ],
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
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    return [
      {
        source: '/home-static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate',
          },
        ],
      },
    ];
  },
};

const config: NextConfig = withMicrofrontends(withI18n(nextConfig), {
  configPath: './microfrontends.json',
});
export default config;
