import { FC } from 'react';
import { ToasterCus } from '@repo/common/components';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE } from '@repo/i18n/const';
import { initLingui } from '@repo/i18n/server';

import Footer from '@/containers/footer';
import Header from '@/containers/header';
import Main from '@/containers/Main';
import { getAllI18nInstances } from '@/lib/importLocales';

export const dynamic = 'force-static';
export const revalidate = 300;

export async function generateStaticParams() {
  return linguiConfig.locales.map((locale) => ({
    locale,
  }));
}

const Page: FC<
  Readonly<{
    params: Promise<{ locale: string }>;
  }>
> = async ({ params }) => {
  const allI18nInstances = await getAllI18nInstances();
  const { locale } = await params;
  initLingui(locale || DEFAULT_LOCALE, allI18nInstances);

  return (
    <>
      <div className="">
        <Header />
        <div className="w-full">
          <Main />
          <Footer />
        </div>
      </div>
      <ToasterCus theme="dark" />
    </>
  );
};

export default Page;
