'use server';

import { loadCatalogs } from '@repo/i18n/server';

const allI18nInstances = loadCatalogs(async (locale) => {
  const { messages } = await import(`@/locales/${locale}/messages.po`);

  const { messages: commonMessages } = await import(
    `@/locales/common/${locale}/messages.po`
  );
  return Object.assign(commonMessages, messages);
});

export const getAllI18nInstances = async () => {
  return allI18nInstances;
};
