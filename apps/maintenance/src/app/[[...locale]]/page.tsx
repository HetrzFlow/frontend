import { msg } from '@lingui/core/macro';
import { getI18nInstance } from '@repo/i18n/server';
import { getAllI18nInstances } from '@/lib/importLocales';
import { MaintenancePageContent } from '../AppContent';
import {
  generateOptionalLocaleStaticParams,
  resolveLocaleFromParams,
  type OptionalLocaleParams,
} from './routeLocale';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return generateOptionalLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<OptionalLocaleParams>;
}) {
  const locale = resolveLocaleFromParams(await params);
  const i18n = getI18nInstance(locale, await getAllI18nInstances());

  return {
    title: i18n._(msg`HertzFlow | The world leverage engine`),
    description: i18n._(
      msg`Trade anything you want with a leverage from your wallet with confidence.`,
    ),
  };
}

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OptionalLocaleParams>;
}>) {
  const locale = resolveLocaleFromParams(await params);
  getI18nInstance(locale, await getAllI18nInstances());

  return <MaintenancePageContent />;
}
