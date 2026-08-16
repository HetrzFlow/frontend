import type { Messages } from '@lingui/core';

export async function loadMessages(locale: string): Promise<Messages> {
  const [
    { messages: commonMessages },
    { messages: localCommonMessages },
    { messages },
  ] = await Promise.all([
    import(`@repo/common/locales/${locale}/messages.po`),
    import(`@/locales/common/${locale}/messages.po`),
    import(`@/locales/${locale}/messages.po`),
  ]);

  return Object.assign({}, commonMessages, localCommonMessages, messages);
}
