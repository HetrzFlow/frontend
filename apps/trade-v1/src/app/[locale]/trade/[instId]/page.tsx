import { notFound } from 'next/navigation';
import { msg } from '@lingui/core/macro';

import linguiConfig from '@repo/i18n/config/lingui.config';
import { getI18nInstance } from '@repo/i18n/server';

import PageClient from '@/components/PageClient';
import { getAllI18nInstances } from '@/lib/importLocales';

export const dynamicParams = false;
export const dynamic = 'force-static';
export const revalidate = 300;

export async function generateStaticParams() {
  const { data } = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL_1}/data-statistics-query/api/v1/tokens/perpable`,
  )
    .then((res) => res.json())
    .catch(() => {
      return {
        data: {
          items: [
            { coin_name: 'BTC' },
            { coin_name: 'ETH' },
            { coin_name: 'SUI' },
          ],
        },
      };
    }); // get all trade insts

  const symbols = data.items as { coin_name: string }[];

  return linguiConfig.locales.flatMap((locale) =>
    symbols.map(({ coin_name }) => ({
      locale,
      instId: `${coin_name}-USD`,
    })),
  );
}

export async function generateMetadata(
  props: Readonly<{
    params: Promise<{ locale: string; instId: string }>;
  }>,
) {
  const locale = (await props.params).locale;
  const i18n = getI18nInstance(locale, await getAllI18nInstances());

  const instId = (await props.params).instId;
  const coin = instId.split('-')[0] || '';
  return {
    title: `${i18n._(msg`${coin} | HertzFlow`)}`,
    description: `${i18n._(msg`Trade anything you want with a leverage from your wallet with confidence.`)}`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${locale}/trade/${instId}`,
    },
  };
}

const Page = async (
  props: Readonly<{
    params: Promise<{ locale: string; instId: string }>;
  }>,
) => {
  const instId = (await props.params).instId;

  const { data } = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL_1}/data-statistics-query/api/v1/tokens/perpable`,
    {
      cache: 'force-cache',
      next: { revalidate: 300 },
    },
  )
    .then((res) => res.json())
    .catch(() => {
      return {
        data: {
          items: [
            { coin_name: 'BTC' },
            { coin_name: 'ETH' },
            { coin_name: 'SUI' },
          ],
        },
      };
    });
  // if symbol is not in whitelist, return 404
  if (
    !(data.items as { coin_name: string }[])?.find(
      (v) => `${v.coin_name}-USD` === instId,
    )
  ) {
    notFound();
  }

  return <PageClient instId={instId.replace('-', '/')} />;
};

export default Page;
