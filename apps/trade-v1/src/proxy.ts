/*
 * For more info see
 * https://nextjs.org/docs/app/building-your-application/routing/internationalization
 * */
import { NextResponse, type NextRequest } from 'next/server';
import { i18nMiddleware } from '@repo/i18n/server/middleware';

const DEFAULT_INST_ID = 'SUI-USD';

export const proxy = (request: NextRequest) => {
  // const accept = request.headers.get('accept') || '';
  const nextUrl = request.nextUrl;
  const pathname = nextUrl.pathname;

  if (pathname.endsWith('/trade')) {
    const instId = request.cookies.get('INST_ID')?.value || DEFAULT_INST_ID;
    nextUrl.pathname = `${pathname}/${instId}`;
    return NextResponse.redirect(nextUrl);
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
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!trade-static|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|spline|js)$).*)',
  ],
};
