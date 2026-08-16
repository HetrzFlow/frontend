import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import { LeaderboardPage } from '@/containers/leaderboard/LeaderboardPage';
import { LEADERBOARD_PAGE_SIZE } from '@/containers/leaderboard/mockData';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';
import {
  fetchLeaderboard,
  fetchLeaderboardOverview,
} from '@/services/rest/leaderboard';

export const revalidate = 60;

export async function generateStaticParams() {
  return linguiConfig.locales.map((locale) => ({
    locale,
  }));
}

async function getInitialLeaderboard() {
  return fetchLeaderboard({
    period: '7d',
    sortBy: 'pnl',
    page: 1,
    pageSize: LEADERBOARD_PAGE_SIZE,
  }).catch(() => undefined);
}

async function getInitialOverview() {
  return fetchLeaderboardOverview().catch(() => undefined);
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
    languages[loc] = `${locBase}/leaderboard`;
  }
  languages['x-default'] = `${BASE_URL}/en/leaderboard`;

  const title = i18n._(msg`Leaderboard | HertzFlow`);
  const description = i18n._(
    msg`View top HertzFlow traders by rank, PnL, volume, and points.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/leaderboard`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/leaderboard`,
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
  const [allI18nInstances, initialLeaderboard, initialOverview] =
    await Promise.all([
      getAllI18nInstances(),
      getInitialLeaderboard(),
      getInitialOverview(),
    ]);
  const i18n = initLingui(locale, allI18nInstances);

  return (
    <main className="h-full min-h-0">
      <h1 className="sr-only">
        {i18n._(msg`Leaderboard — HertzFlow trader rankings`)}
      </h1>
      <LeaderboardPage
        initialLeaderboard={initialLeaderboard}
        initialOverview={initialOverview}
      />
    </main>
  );
};

export default Page;
