import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import LaunchContainer from '@/containers/launch';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateStaticParams() {
  return linguiConfig.locales.map((locale) => ({
    locale,
  }));
}

const BASE_URL = getConfiguredSiteUrl();

export async function generateMetadata(
  props: Readonly<{
    params: Promise<{ locale: string }>;
  }>,
) {
  const locale = (await props.params).locale;
  const i18n = getI18nInstance(locale, await getAllI18nInstances(locale));

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const locBase = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
    languages[loc] = `${locBase}/launch`;
  }
  languages['x-default'] = `${BASE_URL}/en/launch`;

  const title = i18n._(msg`Launch Market | HertzFlow`);
  const description = i18n._(
    msg`Launch your own perpetual market on HertzFlow. Permissionless market creation with customizable parameters.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/launch`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/launch`,
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
  const allI18nInstances = await getAllI18nInstances(locale);
  initLingui(locale, allI18nInstances);

  return <LaunchContainer />;
};

export default Page;
