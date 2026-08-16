import type { NextConfig } from 'next';

export const withI18n = (nextConfig: NextConfig = {}) => {
  return {
    ...nextConfig,
    experimental: {
      ...nextConfig.experimental,
      swcPlugins: [
        ...(nextConfig.experimental?.swcPlugins || []),
        ['@lingui/swc-plugin', {}],
      ],
    },
    turbopack: {
      ...(nextConfig.turbopack || {}),
      rules: {
        ...(nextConfig.turbopack?.rules || {}),
        '*.po': {
          loaders: ['@lingui/loader'],
          as: '*.js',
        },
      },
    },
    webpack: (config, context) => {
      config.module.rules.push({
        test: /\.po/,
        use: [
          {
            loader: '@lingui/loader',
            options: { as: '*.js' },
          },
        ],
      });

      if (nextConfig.webpack) {
        return nextConfig.webpack(config, context);
      }

      return config;
    },
  } as NextConfig;
};
