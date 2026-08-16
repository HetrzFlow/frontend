import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import PoolsLayoutEntry from '@/layouts/pools/entry';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';
import {
  CATEGORY,
  DEFAULT_POOLS_LIST_PAGE_SIZE,
  fetchPoolsList,
  fetchPoolsOverview,
} from '@/services/rest/pools';

export const revalidate = 300;

export async function generateStaticParams() {
  return linguiConfig.locales.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata(
  props: Readonly<{
    params: Promise<{ locale: string }>;
  }>,
) {
  const locale = (await props.params).locale;
  const i18n = getI18nInstance(locale, await getAllI18nInstances());
  const BASE_URL = getConfiguredSiteUrl();

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const locBase = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
    languages[loc] = `${locBase}/pools`;
  }
  languages['x-default'] = `${BASE_URL}/en/pools`;

  const title = i18n._(msg`Liquidity Pools | HertzFlow`);
  const description = i18n._(
    msg`Provide liquidity to HertzFlow pools and earn trading fees. Single-asset deposits with real-time APY tracking.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/pools`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/pools`,
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
    params: Promise<{ locale: string }>;
  }>,
) => {
  const locale = (await props.params).locale;
  const allI18nInstancesPromise = getAllI18nInstances();
  const initialPoolsListDataPromise = fetchPoolsList({
    category: CATEGORY.all,
    page: 1,
    page_size: DEFAULT_POOLS_LIST_PAGE_SIZE,
    sort_by: 'tvl_usd',
    sort_order: 'desc',
  }).catch(() => undefined);
  const initialPoolsOverviewDataPromise = fetchPoolsOverview().catch(
    () => undefined,
  );
  const [allI18nInstances, initialPoolsListData, initialPoolsOverviewData] =
    await Promise.all([
      allI18nInstancesPromise,
      initialPoolsListDataPromise,
      initialPoolsOverviewDataPromise,
    ]);
  const i18n = initLingui(locale, allI18nInstances);

  return (
    <>
      <h1 className="sr-only">
        {i18n._(msg`Liquidity Pools — Provide Liquidity on HertzFlow`)}
      </h1>
      <PoolsLayoutEntry
        initialPoolsListData={initialPoolsListData}
        initialPoolsOverviewData={initialPoolsOverviewData}
      />
    </>
  );
};

export default Page;
