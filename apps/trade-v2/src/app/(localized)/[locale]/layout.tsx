import { FC } from 'react';
import { notFound } from 'next/navigation';

import linguiConfig from '@repo/i18n/config/lingui.config';
import { initLingui } from '@repo/i18n/server';
import FirstVisit from '@/common/containers/firstVisit';
import Layout from '@/common/layout';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { generateRootMetadata } from '../../root-shell';

const allI18nInstances = await getAllI18nInstances();

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
  const { locale } = await props.params;
  if (!linguiConfig.locales.includes(locale)) {
    notFound();
  }
  return generateRootMetadata(locale);
}

const RootLayout: FC<
  Readonly<{
    params: Promise<{ locale: string }>;
    children: React.ReactNode;
  }>
> = async ({ children, params }) => {
  const { locale } = await params;
  if (!linguiConfig.locales.includes(locale)) {
    notFound();
  }
  const i18nInstance = initLingui(locale, allI18nInstances);
  const genesisStandalone = process.env.GENESIS_STANDALONE === 'true';

  return (
    <Layout
      locale={locale}
      localeMessages={i18nInstance.messages}
      genesisStandalone={genesisStandalone}
    >
      {children}
      <FirstVisit disabled={genesisStandalone} />
    </Layout>
  );
};

export default RootLayout;
