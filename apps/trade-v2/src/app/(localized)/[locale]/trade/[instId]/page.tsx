import { notFound, redirect } from 'next/navigation';
import { msg } from '@lingui/core/macro';

import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance } from '@repo/i18n/server';

import PageClient from '@/components/PageClient';
import { DEFAULT_INST_ID } from '@/constants/common';
import {
  buildTradeRouteInstId,
  buildTradeRouteInstIdByCategory,
  parseTradeRouteInstId,
} from '@/lib/credit/creditMarkets';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';

export const dynamicParams = true;
export const revalidate = 300;

type MarketRouteItem = {
  symbol: string;
  display_name: string;
  category?: string;
  is_view?: boolean;
};

// Module-level cache for stale-while-revalidate
let cachedMarkets: MarketRouteItem[] | null = null;

function getMarketRouteIds(markets: MarketRouteItem[]) {
  return [
    ...new Set(
      markets.map((market) => {
        return buildTradeRouteInstIdByCategory(
          market.display_name ?? market.symbol,
          market.category,
        );
      }),
    ),
  ];
}

const fetchMarkets = async () => {
  let requestFailed = false;
  const resData = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL_BSC}/api/v1/bsc/markets`,
    {
      next: { revalidate: 300 },
    },
  )
    .then(
      (r) =>
        r.json() as Promise<{
          data: { markets: MarketRouteItem[] };
        }>,
    )
    .catch(() => {
      requestFailed = true;
      return {
        data: {
          markets: [
            { symbol: 'BTC/USD', display_name: 'BTC/USD' },
          ] as MarketRouteItem[],
        },
      };
    });

  const markets = (resData.data?.markets || []).filter(
    (v) => v.is_view ?? true,
  );

  if (!requestFailed || !cachedMarkets) {
    cachedMarkets = markets;
  }

  return markets;
};

const getAllMarkets = async (): Promise<MarketRouteItem[]> => {
  // Always await the refresh. Next.js already caches the request for 300
  // seconds, while an unawaited refresh can race generateStaticParams and
  // produce inconsistent prerender manifests.
  return fetchMarkets();
};

export async function generateStaticParams() {
  const markets = await getAllMarkets();
  const routeIds = getMarketRouteIds(markets);

  return linguiConfig.locales.flatMap((locale) =>
    routeIds.map((instId) => ({
      locale,
      instId,
    })),
  );
}

const BASE_URL = getConfiguredSiteUrl();

export async function generateMetadata(
  props: Readonly<{
    params: Promise<{ locale: string; instId: string }>;
  }>,
) {
  const locale = (await props.params).locale;
  const i18n = getI18nInstance(locale, await getAllI18nInstances(locale));

  const instId = (await props.params).instId;
  const { routeName } = parseTradeRouteInstId(instId);
  const coin = routeName.replace(/(USD$|^USD)/, '');

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const locBase = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
    languages[loc] = `${locBase}/trade/${instId}`;
  }
  languages['x-default'] = `${BASE_URL}/en/trade/${instId}`;

  const title = i18n._(msg`Trade ${coin} | HertzFlow — Up to 200x Leverage`);
  const description = i18n._(
    msg`Trade ${coin} perpetuals with up to 200x leverage on HertzFlow. 100% self-custodial, multi-oracle pricing, zero slippage.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/trade/${instId}`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/trade/${instId}`,
    },
    twitter: {
      ...HOME_TWITTER,
      title,
      description,
    },
  };
}

const Page = async (
  props: Readonly<{
    params: Promise<{ locale: string; instId: string }>;
  }>,
) => {
  const { locale, instId: rawInstId } = await props.params;
  const instId = decodeURIComponent(rawInstId);

  const markets = await getAllMarkets();
  const routeIds = getMarketRouteIds(markets);
  const { routeName, isCreditMarket } = parseTradeRouteInstId(instId);
  const regularRouteInstId = buildTradeRouteInstId(routeName, false);

  // if symbol is not in whitelist, return 404
  if (!routeIds.includes(instId)) {
    if (regularRouteInstId === DEFAULT_INST_ID && routeIds.length) {
      redirect(`/${locale}/trade/${routeIds[0]}`);
    } else {
      notFound();
    }
  }

  return (
    <PageClient routeName={routeName} isCreditMarketRoute={isCreditMarket} />
  );
};

export default Page;
