import { notFound } from 'next/navigation';
import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import { ENABLE_MERITS } from '@/constants/common';
import { MeritsPageClient } from '@/containers/merits/MeritsPage.client';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';

export async function generateStaticParams() {
  if (!ENABLE_MERITS) return [];
  return linguiConfig.locales.map((locale) => ({ locale }));
}

const BASE_URL = getConfiguredSiteUrl();

export async function generateMetadata(
  props: Readonly<{ params: Promise<{ locale: string }> }>,
) {
  if (!ENABLE_MERITS) notFound();

  const locale = (await props.params).locale;
  const i18n = getI18nInstance(locale, await getAllI18nInstances());
  const siteUrl =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;
  const languages: Record<string, string> = {};

  for (const supportedLocale of SUPPORTED_LOCALES) {
    const localeBase =
      supportedLocale === DEFAULT_LOCALE
        ? BASE_URL
        : `${BASE_URL}/${supportedLocale}`;
    languages[supportedLocale] = `${localeBase}/merits`;
  }
  languages['x-default'] = `${BASE_URL}/en/merits`;

  const title = i18n._(msg`Merits | HertzFlow`);
  const description = i18n._(
    msg`Track your Merits, see your rank, and discover ways to earn more.`,
  );

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/merits`, languages },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${siteUrl}/merits`,
    },
    twitter: { ...HOME_TWITTER, title, description },
  };
}

const Page = async (
  props: Readonly<{
    params: Promise<{ locale: string }>;
  }>,
) => {
  if (!ENABLE_MERITS) notFound();

  const [{ locale }, allI18nInstances] = await Promise.all([
    props.params,
    getAllI18nInstances(),
  ]);
  initLingui(locale, allI18nInstances);

  return <MeritsPageClient />;
};

export default Page;
