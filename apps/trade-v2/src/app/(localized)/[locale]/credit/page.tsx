import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';

import { CreditPageClient } from '@/containers/credit/CreditPage.client';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';

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
    languages[loc] = `${locBase}/credit`;
  }
  languages['x-default'] = `${BASE_URL}/en/credit`;

  const title = i18n._(msg`Credit | HertzFlow`);
  const description = i18n._(msg`Credit on HertzFlow.`);

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/credit`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/credit`,
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
  const allI18nInstances = await getAllI18nInstances();
  const i18n = initLingui(locale, allI18nInstances);

  return (
    <>
      <h1 className="sr-only">{i18n._(msg`Credit — HertzFlow`)}</h1>
      <CreditPageClient />
    </>
  );
};

export default Page;
