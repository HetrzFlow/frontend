/*
 * For more info see
 * https://nextjs.org/docs/app/building-your-application/routing/internationalization
 * */
import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { i18nMiddleware } from '@repo/i18n/server/middleware';
import { DEFAULT_INST_ID } from './constants/common';
import { getTradeRoutingDecision } from './host-routing';

const MAINNET_HOST = process.env.MAINNET_HOST;
const REDIRECT_MAINTENANCE = process.env.REDIRECT_MAINTENANCE;
const MAINTENANCE_URL = process.env.MAINTENANCE_URL;
const GENESIS_STANDALONE = process.env.GENESIS_STANDALONE === 'true';
const LOCALE_COOKIE = 'Next-Locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getPathnameLocale(pathname: string) {
  const locale = pathname.split('/')[1];
  return locale && SUPPORTED_LOCALES.includes(locale) ? locale : undefined;
}

export const proxy = (request: NextRequest) => {
  // const accept = request.headers.get('accept') || '';
  const nextUrl = request.nextUrl;
  const pathname = nextUrl.pathname;

  // OAuth providers redirect to one fixed, non-localized URI. Let the shared
  // App Router route handle it directly instead of adding a locale segment.
  if (pathname === '/auth/callback') {
    return NextResponse.next();
  }

  const decision = getTradeRoutingDecision({
    hostHeader: request.headers.get('host'),
    pathname,
    mainnetHost: MAINNET_HOST,
    genesisStandalone: GENESIS_STANDALONE,
    defaultLocale: DEFAULT_LOCALE,
    supportedLocales: SUPPORTED_LOCALES,
    redirectMaintenance: REDIRECT_MAINTENANCE === 'true',
    maintenanceUrl: MAINTENANCE_URL,
  });

  if (decision.type === 'redirect') {
    return NextResponse.redirect(decision.destinationUrl, decision.statusCode);
  }

  if (decision.type === 'rewrite') {
    const url = request.nextUrl.clone();
    url.pathname = decision.destinationPathname;
    return NextResponse.rewrite(url);
  }

  if (decision.type === 'redirect-path') {
    const url = request.nextUrl.clone();
    url.pathname = decision.destinationPathname;
    url.search = '';
    return NextResponse.redirect(url, decision.statusCode);
  }

  if (pathname.endsWith('/trade')) {
    const instId = request.cookies.get('INST_ID')?.value || DEFAULT_INST_ID;
    nextUrl.pathname = `${pathname}/${instId}`;
    const response = NextResponse.redirect(nextUrl);
    const locale = getPathnameLocale(pathname);

    if (locale) {
      response.cookies.set(LOCALE_COOKIE, locale, {
        maxAge: LOCALE_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'strict',
      });
    }

    return response;
  }

  const response = i18nMiddleware(request);

  // const isHTMLRequest =
  //   accept.includes('text/html') &&
  //   !pathname.startsWith('/api') &&
  //   !pathname.match(/\.[\w]+$/);

  // if (isHTMLRequest) {
  //   response.headers.set(
  //     'Cache-Control',
  //     'public, s-maxage=300, stale-while-revalidate=60',
  //   );
  //   // set to validate cache
  //   response.headers.set('Vary', 'Sec-Fetch-Dest');
  // }

  return response;
};

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - OAuth callback and share redirects (non-localized public routes)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|auth/callback|s/|trade-static|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|spline|js)$).*)',
  ],
};
