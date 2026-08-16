import { getConfiguredSiteUrl } from '@repo/common/site-url';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@repo/i18n/const';
import type { MetadataRoute } from 'next';

const BASE_URL = getConfiguredSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return SUPPORTED_LOCALES.map((locale) => ({
    url: locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 1,
  }));
}
