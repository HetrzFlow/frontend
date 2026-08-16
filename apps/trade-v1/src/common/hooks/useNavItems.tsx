import { useMemo } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const useNavItems = () => {
  const { locale } = i18n;

  return useMemo(() => {
    const appPublicDisabled =
      process.env.NEXT_PUBLIC_APP_PUBLIC_DISABLED === 'true';
    return {
      home: {
        link: `${process.env.NEXT_PUBLIC_HOME_URL || ''}/${locale}`,
      },
      trade: {
        link: appPublicDisabled
          ? ''
          : `${process.env.NEXT_PUBLIC_TRADE_URL || ''}/${locale}/trade`,
        label: i18n._(msg`Header.Trade`),
      },
      swap: {
        link: appPublicDisabled
          ? ''
          : `${process.env.NEXT_PUBLIC_TRADE_URL || ''}/${locale}/swap`,
        label: i18n._(msg`Header.Swap`),
      },
      hzlp: {
        link: appPublicDisabled
          ? ''
          : `${process.env.NEXT_PUBLIC_HLP_URL || ''}/${locale}/hzlp`,
        label: i18n._(msg`Header.HzLP`),
      },
      dashboard: {
        link: appPublicDisabled
          ? ''
          : `${process.env.NEXT_PUBLIC_DASHBOARD_URL || ''}/${locale}/dashboard`,
        label: i18n._(msg`Header.Dashboard`),
      },
    };
  }, [locale]);
};
