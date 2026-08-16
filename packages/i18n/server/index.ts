import 'server-only';

import { I18n, Messages, setupI18n, i18n as globalI18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';

import linguiConfig from '../config/lingui.config';
import { DEFAULT_LOCALE } from '../const';

const { locales } = linguiConfig;
// optionally use a stricter union type
type SupportedLocales = string;

type AllI18nInstances = { [K in SupportedLocales]: I18n };

// load all messages for all locales
export const loadCatalogs = async (
  load: (locale: string) => Promise<Messages>,
) => {
  const catalogs = await Promise.all(locales.map(load));
  return Object.fromEntries(
    locales.map((locale, index) => [
      locale,
      setupI18n({
        locale,
        messages: { [locale]: catalogs[index]! },
        locales,
      }),
    ]),
  ) as AllI18nInstances;
};

// get i18n instance
export const getI18nInstance = (
  locale: SupportedLocales,
  allI18nInstances: AllI18nInstances,
): I18n => {
  if (!allI18nInstances[locale]) {
    console.warn(`No i18n instance found for locale "${locale}"`);
  }
  return allI18nInstances[locale]! || allI18nInstances[DEFAULT_LOCALE]!;
};

// set i18n instance in server-side
export function initLingui(locale: string, allI18nInstances: AllI18nInstances) {
  const i18n = getI18nInstance(locale, allI18nInstances); // get a ready-made i18n instance for the given locale
  setI18n(i18n); // make it available server-side for the current request
  globalI18n.load(locale, i18n.messages);
  globalI18n.activate(locale);
  return i18n;
}
