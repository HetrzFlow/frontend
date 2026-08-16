import { getConfiguredSiteUrl } from '@repo/common/site-url';
import type { Metadata } from 'next';

const HOME_ASSET_BASE_URL = (
  process.env.NEXT_PUBLIC_HOME_URL || getConfiguredSiteUrl()
).replace(/\/$/, '');

export const HOME_OG_IMAGE_URL = `${HOME_ASSET_BASE_URL}/home-static/og.webp`;

export const HOME_OG_IMAGE = {
  url: HOME_OG_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: 'HertzFlow — Trade crypto, FX, commodities and stocks with up to 200x leverage.',
} as const;

export const HOME_OPEN_GRAPH = {
  siteName: 'HertzFlow',
  type: 'website',
  images: [HOME_OG_IMAGE],
} satisfies NonNullable<Metadata['openGraph']>;

export const HOME_TWITTER = {
  card: 'summary_large_image',
  images: [HOME_OG_IMAGE_URL],
  site: '@HertzFlow',
} satisfies NonNullable<Metadata['twitter']>;
