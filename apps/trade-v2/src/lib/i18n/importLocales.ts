'use server';

import { type I18n, setupI18n } from '@lingui/core';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE } from '@repo/i18n/const';
import { loadMessages } from './loadMessages';

const { locales } = linguiConfig;

const instanceCache = new Map<string, I18n>();

const getI18nByLocale = async (locale: string) => {
  if (instanceCache.has(locale)) {
    return instanceCache.get(locale)!;
  }

  const messages = await loadMessages(locale);
  const instance = setupI18n({
    locale,
    messages: { [locale]: messages },
    locales,
  });

  instanceCache.set(locale, instance);
  return instance;
};

export const getAllI18nInstances = async (locale?: string) => {
  if (!locale) {
    const entries = await Promise.all(
      locales.map(async (item) => [item, await getI18nByLocale(item)] as const),
    );
    return Object.fromEntries(entries);
  }

  const safeLocale = locales.includes(locale) ? locale : DEFAULT_LOCALE;
  const result: Record<string, I18n> = {
    [safeLocale]: await getI18nByLocale(safeLocale),
  };

  if (safeLocale !== DEFAULT_LOCALE) {
    result[DEFAULT_LOCALE] = await getI18nByLocale(DEFAULT_LOCALE);
  }

  return result;
};
