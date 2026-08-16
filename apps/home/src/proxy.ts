/*
 * For more info see
 * https://nextjs.org/docs/app/building-your-application/routing/internationalization
 * */
import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES } from '@repo/i18n/const';
import { i18nMiddleware } from '@repo/i18n/server/middleware';
import { getHomeRoutingDecision } from './host-routing';

const TESTNET_HOST = process.env.TESTNET_HOST;
const MAINNET_HOST = process.env.MAINNET_HOST;

export const proxy = (req: NextRequest) => {
  if (req.method === 'OPTIONS' && req.nextUrl.pathname === '/') {
    return new NextResponse(null, { status: 204 });
  }

  const decision = getHomeRoutingDecision({
    hostHeader: req.headers.get('host'),
    pathname: req.nextUrl.pathname,
    testnetHost: TESTNET_HOST,
    mainnetHost: MAINNET_HOST,
  });

  if (decision.type === 'redirect') {
    const url = new URL(req.url);
    url.protocol = 'https:';
    url.host = decision.destinationHost;
    return NextResponse.redirect(url, decision.statusCode);
  }

  const [, localeSegment] = req.nextUrl.pathname.split('/');
  if (localeSegment && SUPPORTED_LOCALES.includes(localeSegment)) {
    return NextResponse.next();
  }

  return i18nMiddleware(req);
};

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp, .mp4
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!home-static/_next|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|spline|js|glb|lottie|json|txt|xml|pdf|zip)$|google.*).*)',
  ],
};
