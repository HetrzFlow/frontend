import React from 'react';
import { msg } from '@lingui/core/macro';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { getI18nInstance } from '@repo/i18n/server';
import Main from '@/app/[locale]/dashboard/Main';
import { getAllI18nInstances } from '@/lib/importLocales';

import '@/styles/dashboard.css';
export const dynamic = 'force-static';
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

  return {
    title: `${i18n._(msg`HertzFlow | The world leverage engine`)}`,
    description: `${i18n._(msg`Trade anything you want with a leverage from your wallet with confidence.`)}`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${locale}/dashboard`,
    },
  };
}

const Page = () => {
  return <Main />;
};

export default Page;
