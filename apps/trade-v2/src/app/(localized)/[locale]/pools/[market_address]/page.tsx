import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance } from '@repo/i18n/server';
import PoolDetailLayoutEntry from '@/layouts/pools-detail/entry';
import { toChecksumAddress, toValidChecksumAddress } from '@/lib/address';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';
import { CATEGORY, fetchPoolsList } from '@/services/rest/pools';

export const revalidate = 86400;
export const dynamicParams = true;

type PoolRouteItem = {
  market_address?: string;
  is_view?: boolean;
};

const POOL_ROUTE_PAGE_SIZE = 100;

let cachedPoolRouteAddresses: string[] | null = null;

function getPoolRouteAddresses(pools: PoolRouteItem[]) {
  return [
    ...new Set(
      pools
        .filter((pool) => pool.is_view ?? true)
        .map((pool) => toValidChecksumAddress(pool.market_address))
        .filter((address) => address !== undefined),
    ),
  ];
}

async function fetchPoolRouteAddresses() {
  let requestFailed = false;

  const pools = await fetchPoolsList({
    category: CATEGORY.all,
    page: 1,
    page_size: POOL_ROUTE_PAGE_SIZE,
  })
    .then(async (firstPage) => {
      const allPools = [...(firstPage.pools ?? [])];
      const totalCount = firstPage.total_count ?? allPools.length;
      const totalPages = Math.ceil(totalCount / POOL_ROUTE_PAGE_SIZE);

      for (let page = 2; page <= totalPages; page += 1) {
        const nextPage = await fetchPoolsList({
          category: CATEGORY.all,
          page,
          page_size: POOL_ROUTE_PAGE_SIZE,
        });
        allPools.push(...(nextPage.pools ?? []));
      }

      return allPools;
    })
    .catch(() => {
      requestFailed = true;
      return cachedPoolRouteAddresses
        ? cachedPoolRouteAddresses.map((market_address) => ({
            market_address,
          }))
        : [];
    });

  const addresses = getPoolRouteAddresses(pools);
  if (!requestFailed || !cachedPoolRouteAddresses) {
    cachedPoolRouteAddresses = addresses;
  }

  return addresses;
}

async function getAllPoolRouteAddresses() {
  if (cachedPoolRouteAddresses) {
    void fetchPoolRouteAddresses();
    return cachedPoolRouteAddresses;
  }

  return await fetchPoolRouteAddresses();
}

interface PoolDetailPageProps {
  params: Promise<{
    locale: string;
    market_address: string;
  }>;
}

export async function generateStaticParams() {
  const addresses = await getAllPoolRouteAddresses();

  return linguiConfig.locales.flatMap((locale) =>
    addresses.map((market_address) => ({
      locale,
      market_address,
    })),
  );
}

export async function generateMetadata({ params }: PoolDetailPageProps) {
  const { locale, market_address } = await params;
  const i18n = getI18nInstance(locale, await getAllI18nInstances());
  const BASE_URL = getConfiguredSiteUrl();
  const canonicalMarketAddress = toChecksumAddress(market_address);

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const locBase = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
    languages[loc] = `${locBase}/pools/${canonicalMarketAddress}`;
  }
  languages['x-default'] = `${BASE_URL}/en/pools/${canonicalMarketAddress}`;

  const title = i18n._(msg`Pool Details | HertzFlow`);
  const description = i18n._(
    msg`View pool details, APY, and liquidity stats. Provide liquidity to earn trading fees on HertzFlow.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/pools/${canonicalMarketAddress}`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/pools/${canonicalMarketAddress}`,
    },
    twitter: {
      ...HOME_TWITTER,
      title,
      description,
    },
  };
}

const PoolDetailPage = async ({ params }: PoolDetailPageProps) => {
  const { market_address, locale } = await params;
  const allI18nInstances = await getAllI18nInstances();
  const i18n = getI18nInstance(locale, allI18nInstances);
  const canonicalMarketAddress = toChecksumAddress(market_address);

  return (
    <>
      <h1 className="sr-only">{i18n._(msg`Pool Details`)}</h1>
      <PoolDetailLayoutEntry market_address={canonicalMarketAddress} />
    </>
  );
};

export default PoolDetailPage;
