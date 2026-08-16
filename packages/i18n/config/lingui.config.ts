import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../const';

/** @type {import('@lingui/conf').LinguiConfig} */
export default {
  locales: SUPPORTED_LOCALES,
  sourceLocale: DEFAULT_LOCALE,
  fallbackLocales: {
    default: DEFAULT_LOCALE,
  },
};
