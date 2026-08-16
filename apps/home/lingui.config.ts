import config from '@repo/i18n/config/lingui.config';

/** @type {import('@lingui/conf').LinguiConfig} */
export default {
  ...config,
  catalogs: [
    {
      path: '<rootDir>/locales/{locale}/messages',
      include: ['src'],
    },
  ],
};
