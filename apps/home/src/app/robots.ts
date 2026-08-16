import { getConfiguredSiteUrl } from '@repo/common/site-url';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import type { MetadataRoute } from 'next';

const DISALLOWED_PATHS = ['/trade'];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getConfiguredSiteUrl();
  const localizedDisallow = SUPPORTED_LOCALES.filter(
    (locale) => locale !== DEFAULT_LOCALE,
  ).flatMap((locale) =>
    DISALLOWED_PATHS.map((path) => `/${locale}${path}`),
  );

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...DISALLOWED_PATHS, ...localizedDisallow],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
