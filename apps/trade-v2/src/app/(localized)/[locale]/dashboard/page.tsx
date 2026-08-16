import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import { DASHBOARD_CHART_DEFINITIONS } from '@/containers/dashboard/DashboardChartArea/dashboardChart.data';
import type { DashboardInitialChartData } from '@/containers/dashboard/DashboardChartArea/dashboardChart.types';
import DashboardClientContent from '@/containers/dashboard/DashboardClientContent.client';
import DashboardHeader from '@/containers/dashboard/DashboardHeader';
import DashboardScrollEffects from '@/containers/dashboard/DashboardScrollEffects.client';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';
import {
  fetchDashboardChartData,
  getDashboardStateKey,
} from '@/queries/bsc/dashboard';

export const revalidate = 1800;

const INITIAL_DASHBOARD_CHART_COUNT = 4;

export async function generateStaticParams() {
  return linguiConfig.locales.map((locale) => ({
    locale,
  }));
}

async function getDashboardInitialData() {
  const chartEntriesPromise = Promise.all(
    DASHBOARD_CHART_DEFINITIONS.slice(0, INITIAL_DASHBOARD_CHART_COUNT).map(
      async (definition) => {
        const state = definition.getInitialState();
        const data = await fetchDashboardChartData(definition.id, state).catch(
          () => undefined,
        );

        if (!data) return null;

        return [
          definition.id,
          {
            stateKey: getDashboardStateKey(state),
            data,
          },
        ] as const;
      },
    ),
  );

  const chartEntries = await chartEntriesPromise;

  return {
    charts: Object.fromEntries(
      chartEntries.filter((entry): entry is NonNullable<typeof entry> =>
        Boolean(entry),
      ),
    ) as DashboardInitialChartData,
  };
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
    languages[loc] = `${locBase}/dashboard`;
  }
  languages['x-default'] = `${BASE_URL}/en/dashboard`;

  const title = i18n._(msg`Dashboard | HertzFlow — Up to 200x Leverage`);
  const description = i18n._(
    msg`Trade perpetuals with up to 200x leverage on HertzFlow. 100% self-custodial, multi-oracle pricing, zero slippage.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/dashboard`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/dashboard`,
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
  const [allI18nInstances, initialData] = await Promise.all([
    getAllI18nInstances(),
    getDashboardInitialData(),
  ]);
  const i18n = initLingui(locale, allI18nInstances);

  return (
    <>
      <h1 className="sr-only">
        {i18n._(msg`Dashboard — Dashboard for HertzFlow`)}
      </h1>
      <DashboardScrollEffects />
      <div className="dashboard-page relative isolate px-4 pt-14 pb-[calc(120px+env(safe-area-inset-bottom))] md:px-0 md:pt-24 md:pb-20">
        <div className="relative z-10">
          <DashboardHeader />
          <DashboardClientContent initialChartData={initialData.charts} />
        </div>
      </div>
    </>
  );
};

export default Page;
