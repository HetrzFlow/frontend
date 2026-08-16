import path from 'path';
import { withMicrofrontends } from '@vercel/microfrontends/next/config';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { withI18n } from '@repo/i18n/config/next';

import type { NextConfig } from 'next';

const isGenesisStandalone = process.env.GENESIS_STANDALONE === 'true';
// The new web-hub-trade-v2-testnet project is deployed as a standalone site.
// The existing web-hub-trade-v2 project runs as the mainnet child application
// in the home microfrontends group.
const isMicrofrontendsEnabled = process.env.MICROFRONTENDS_ENABLED === 'true';

const nextConfig: NextConfig = withI18n({
  assetPrefix: '/trade-static',
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [100, 75],
  },
  transpilePackages: ['@repo/ui', '@repo/i18n', '@repo/common'],
  reactCompiler: true,
  experimental: {
    globalNotFound: true,
    optimizeCss: true,
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
    optimizePackageImports: [
      '@repo/ui',
      '@repo/common',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-switch',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar',
      'recharts',
      'lucide-react',
      '@privy-io/react-auth',
      'viem',
      '@/common',
      '@hertzflow/sdk-v2',
    ],
  },
  webpack: (config: Parameters<NonNullable<NextConfig['webpack']>>[0]) => {
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /ox[\\/]_esm[\\/]tempo[\\/]internal[\\/]virtualMasterPool\.js$/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    Object.assign(config.resolve.alias, {
      '@/locales': path.resolve(__dirname, './locales'),
      '@/': path.resolve(__dirname, './src'),
      '@react-native-async-storage/async-storage': false,
      // ponytail: Privy marks these peers optional; install them only if those features are enabled.
      '@farcaster/mini-app-solana': false,
      '@stripe/crypto': false,
    });

    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module:
          /node_modules\/ox\/_esm\/tempo\/internal\/virtualMasterPool\.js/,
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
  redirects: async () => {
    if (isGenesisStandalone) {
      return [];
    }

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
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    return [
      {
        source: '/trade-static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, must-revalidate',
          },
        ],
      },
      {
        source: '/trade-static/charting_library/bundles/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `object-src 'none';base-uri 'self';frame-ancestors 'self';`,
          },
        ],
      },
    ];
  },
});

export default isGenesisStandalone || !isMicrofrontendsEnabled
  ? nextConfig
  : withMicrofrontends(nextConfig, {
      configPath: '../home/microfrontends.json',
    });
