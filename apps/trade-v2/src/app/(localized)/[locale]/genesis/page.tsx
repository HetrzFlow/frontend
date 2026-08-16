import { notFound } from 'next/navigation';
import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance, initLingui } from '@repo/i18n/server';
import { percentFormat, thoFormat } from '@repo/lib/format';

import { GenesisPageClient } from '@/containers/genesis/GenesisPage.client';
import { GENESIS_INTEGER_FORMAT_OPTIONS } from '@/containers/genesis/lib/constants';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';
import { fetchGenesisVaultConfig } from '@/services/rest/genesis';

const IS_GENESIS_STANDALONE = process.env.GENESIS_STANDALONE === 'true';

export async function generateStaticParams() {
  if (!IS_GENESIS_STANDALONE) {
    return [];
  }

  return linguiConfig.locales.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata(
  props: Readonly<{
    params: Promise<{ locale: string }>;
  }>,
) {
  if (!IS_GENESIS_STANDALONE) {
    notFound();
  }

  const locale = (await props.params).locale;
  const i18n = getI18nInstance(locale, await getAllI18nInstances());
  const genesisConfig = await fetchGenesisVaultConfig().catch(() => undefined);
  const BASE_URL = getConfiguredSiteUrl();

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;
  const getGenesisUrl = (targetLocale: string) => {
    const localeBase =
      targetLocale === DEFAULT_LOCALE
        ? BASE_URL
        : `${BASE_URL}/${targetLocale}`;

    return localeBase;
  };

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = getGenesisUrl(loc);
  }
  languages['x-default'] = BASE_URL;

  const title = i18n._(msg`Genesis Vault | HertzFlow`);
  const aprLabel =
    genesisConfig?.apr === undefined
      ? '--'
      : percentFormat(genesisConfig.apr / 100, 2, {
          stripTrailingZeros: true,
        });
  const boostLabel =
    genesisConfig?.boostMultiplier === undefined
      ? '--'
      : `${thoFormat(
          genesisConfig.boostMultiplier,
          GENESIS_INTEGER_FORMAT_OPTIONS,
        )}x`;
  const description = i18n._(
    msg`Genesis event for HertzFlow Mainnet liquidity. Deposit to earn ~${aprLabel} APY and a ${boostLabel} Merits boost.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: SITE_URL,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: SITE_URL,
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
  if (!IS_GENESIS_STANDALONE) {
    notFound();
  }

  const locale = (await props.params).locale;
  const allI18nInstances = await getAllI18nInstances();
  const i18n = initLingui(locale, allI18nInstances);

  return (
    <>
      <h1 className="sr-only">
        {i18n._(msg`Genesis Vault — Pre-Deposit on HertzFlow`)}
      </h1>
      <GenesisPageClient />
    </>
  );
};

export default Page;
