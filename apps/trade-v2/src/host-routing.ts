export type TradeRoutingDecision =
  | {
      type: 'redirect';
      destinationUrl: string;
      statusCode: 307;
    }
  | {
      type: 'rewrite';
      destinationPathname: string;
    }
  | {
      type: 'redirect-path';
      destinationPathname: string;
      statusCode: 308;
    }
  | {
      type: 'next';
    };

function normalizeHost(host: string | null | undefined) {
  if (!host) return '';

  const trimmedHost = host.trim();

  if (!trimmedHost) return '';

  if (trimmedHost.includes('://')) {
    try {
      return new URL(trimmedHost).host.split(':')[0]?.toLowerCase() ?? '';
    } catch {
      return '';
    }
  }

  return trimmedHost.split(':')[0]?.toLowerCase() ?? '';
}

type GetTradeRoutingDecisionParams = {
  hostHeader: string | null;
  pathname: string;
  mainnetHost?: string;
  genesisStandalone?: boolean;
  defaultLocale?: string;
  supportedLocales?: readonly string[];
  redirectMaintenance: boolean;
  maintenanceUrl?: string;
};

const DEFAULT_SUPPORTED_LOCALES = ['en', 'zh-Hans', 'zh-Hant'];
const TRADE_SEGMENTS = [
  'trade',
  'pools',
  'vaults',
  'dashboard',
  'referral',
  'credit',
  'leaderboard',
];
const LOCALE_TRADE_PATH_RE = new RegExp(
  `^/[^/]+/(${TRADE_SEGMENTS.join('|')})(?:/.*)?$`,
);

function isTradePath(pathname: string) {
  return (
    TRADE_SEGMENTS.some(
      (segment) =>
        pathname === `/${segment}` || pathname.startsWith(`/${segment}/`),
    ) || LOCALE_TRADE_PATH_RE.test(pathname)
  );
}

function getLocaleBlockedPath(pathname: string) {
  const match = pathname.match(/^\/([^/]+)\/trade(?:\/.*)?$/);

  if (match) {
    return `/${match[1]}/_blocked-not-found`;
  }

  return '/en/_blocked-not-found';
}

function getStandaloneNotFoundPath(
  pathname: string,
  defaultLocale: string,
  supportedLocales: readonly string[],
) {
  const locale = pathname.split('/')[1];
  const notFoundLocale =
    locale && supportedLocales.includes(locale) ? locale : defaultLocale;

  return `/${notFoundLocale}/_blocked-not-found`;
}

export function getTradeRoutingDecision({
  hostHeader,
  pathname,
  mainnetHost,
  genesisStandalone = false,
  defaultLocale = 'en',
  supportedLocales = DEFAULT_SUPPORTED_LOCALES,
  redirectMaintenance,
  maintenanceUrl,
}: GetTradeRoutingDecisionParams): TradeRoutingDecision {
  if (genesisStandalone) {
    // OAuth providers must be able to return to the standalone Genesis host.
    // This route validates the callback in the opener and renders no product UI.
    if (pathname === '/auth/callback') {
      return { type: 'next' };
    }

    if (pathname === '/') {
      return {
        type: 'rewrite',
        destinationPathname: `/${defaultLocale}/genesis`,
      };
    }

    if (pathname === `/${defaultLocale}`) {
      return {
        type: 'redirect-path',
        destinationPathname: '/',
        statusCode: 308,
      };
    }

    const pathWithoutLeadingSlash = pathname.slice(1);
    if (supportedLocales.includes(pathWithoutLeadingSlash)) {
      return {
        type: 'rewrite',
        destinationPathname: `${pathname}/genesis`,
      };
    }

    if (pathname === '/genesis') {
      return {
        type: 'redirect-path',
        destinationPathname: '/',
        statusCode: 308,
      };
    }

    for (const locale of supportedLocales) {
      if (pathname === `/${locale}/genesis`) {
        return {
          type: 'redirect-path',
          destinationPathname: locale === defaultLocale ? '/' : `/${locale}`,
          statusCode: 308,
        };
      }
    }

    return {
      type: 'rewrite',
      destinationPathname: getStandaloneNotFoundPath(
        pathname,
        defaultLocale,
        supportedLocales,
      ),
    };
  }

  if (redirectMaintenance && maintenanceUrl && isTradePath(pathname)) {
    return {
      type: 'redirect',
      destinationUrl: maintenanceUrl,
      statusCode: 307,
    };
  }

  const normalizedHost = normalizeHost(hostHeader);
  const normalizedMainnetHost = normalizeHost(mainnetHost);

  if (
    normalizedHost &&
    normalizedMainnetHost &&
    normalizedHost === normalizedMainnetHost &&
    isTradePath(pathname)
  ) {
    return {
      type: 'rewrite',
      destinationPathname: getLocaleBlockedPath(pathname),
    };
  }

  return { type: 'next' };
}

export { normalizeHost };
