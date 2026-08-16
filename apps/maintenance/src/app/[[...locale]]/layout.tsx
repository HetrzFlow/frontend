import { FC } from 'react';
import { generateLocaleMetadata, LocalizedProviders } from '../i18n';
import {
  generateOptionalLocaleStaticParams,
  resolveLocaleFromParams,
  type OptionalLocaleParams,
} from './routeLocale';

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
  return generateLocaleMetadata(locale);
}

const LocaleLayout: FC<
  Readonly<{
    children: React.ReactNode;
    params: Promise<OptionalLocaleParams>;
  }>
> = async ({ children, params }) => {
  const locale = resolveLocaleFromParams(await params);

  return <LocalizedProviders locale={locale}>{children}</LocalizedProviders>;
};

export default LocaleLayout;
