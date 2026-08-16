'use client';

import { useState } from 'react';

import { type Messages, setupI18n, i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';

export { i18n };

export function LinguiClientProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale: string;
  initialMessages: Messages;
}) {
  const [_i18n] = useState(() => {
    i18n.loadAndActivate({
      locale: initialLocale,
      messages: initialMessages,
    });
    return setupI18n({
      locale: initialLocale,
      messages: { [initialLocale]: initialMessages },
    });
  });

  return <I18nProvider i18n={_i18n}>{children}</I18nProvider>;
}
