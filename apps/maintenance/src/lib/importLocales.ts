import { loadCatalogs } from '@repo/i18n/server';

const allI18nInstances = loadCatalogs(async (locale) => {
  const { messages } = await import(`@/locales/${locale}/messages.po`);

  const { messages: localCommonMessages } = await import(
    `@/locales/common/${locale}/messages.po`
  );

  const { messages: commonMessages } = await import(
    `@repo/common/locales/${locale}/messages.po`
  );
  return Object.assign({}, commonMessages, localCommonMessages, messages);
});

export const getAllI18nInstances = async () => {
  return allI18nInstances;
};

