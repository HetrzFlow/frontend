export const DEFAULT_SITE_URL = 'https://www.hertzflow.xyz';

const trimTrailingSlash = (url: string) => url.replace(/\/$/, '');

export const getConfiguredSiteUrl = (fallback = DEFAULT_SITE_URL) => {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return trimTrailingSlash(configuredUrl || fallback);
};

export const getSiteBaseUrl = (
  headersList?: Headers,
  fallback = DEFAULT_SITE_URL,
) => {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) return trimTrailingSlash(configuredUrl);

  const host =
    headersList?.get('x-forwarded-host') ?? headersList?.get('host') ?? '';
  if (!host) return trimTrailingSlash(fallback);

  const forwardedProto = headersList?.get('x-forwarded-proto');
  const protocol =
    forwardedProto ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : 'https');

  return `${protocol}://${host}`;
};
