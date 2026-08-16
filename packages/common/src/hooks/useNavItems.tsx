import { useMemo } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { DEFAULT_LOCALE } from '@repo/i18n/const';

export const useNavItems = () => {
  const { locale } = i18n;

  return useMemo(() => {
    const tradeHost = process.env.NEXT_PUBLIC_TRADE_URL || '';
    const localPrefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
    const appPublicDisabled =
      process.env.NEXT_PUBLIC_APP_PUBLIC_DISABLED === 'true';
    const homeHost = process.env.NEXT_PUBLIC_HOME_URL ?? '';
    const genesisHost =
      process.env.NEXT_PUBLIC_GENESIS_URL ?? 'https://early.hertzflow.xyz';
    const tradeUrl = 'trade';
    const dashboardUrl = 'dashboard';
    const poolsUrl = 'pools';
    const vaultsUrl = 'vaults';
    const meritsUrl = 'merits';
    const launchUrl = 'launch';
    const referralUrl = 'referral';
    const creditUrl = 'credit';
    const leaderboardUrl = 'leaderboard';

    return {
      home: {
        link: `${homeHost}${localPrefix}/`,
        project: 'home',
      },
      mediaKit: {
        link: `${homeHost}${localPrefix}/mediakit`,
        project: 'home',
      },
      trade: {
        link: appPublicDisabled ? '' : `${tradeHost}${localPrefix}/${tradeUrl}`,
        label: i18n._(msg`Header.Trade`),
        project: 'trade',
      },
      dashboard: {
        link: appPublicDisabled
          ? ''
          : `${tradeHost}${localPrefix}/${dashboardUrl}`,
        label: i18n._(msg`Header.Dashboard`),
        project: 'trade',
      },
      pools: {
        link: appPublicDisabled ? '' : `${tradeHost}${localPrefix}/${poolsUrl}`,
        label: i18n._(msg`Header.Pools`),
        project: 'trade',
      },
      vaults: {
        link: appPublicDisabled
          ? ''
          : `${tradeHost}${localPrefix}/${vaultsUrl}`,
        label: i18n._(msg`Header.Vaults`),
        project: 'trade',
      },
      merits: {
        link: appPublicDisabled
          ? ''
          : `${tradeHost}${localPrefix}/${meritsUrl}`,
        label: i18n._(msg`Header.Merits`),
        project: 'trade',
      },
      genesis: {
        link: appPublicDisabled ? '' : `${genesisHost}${localPrefix}/`,
        label: i18n._(msg`Header.Genesis`),
        project: 'genesis',
      },
      referral: {
        link: appPublicDisabled
          ? ''
          : `${tradeHost}${localPrefix}/${referralUrl}`,
        label: i18n._(msg`Header.Referral`),
        project: 'trade',
      },
      credit: {
        link: appPublicDisabled
          ? ''
          : `${tradeHost}${localPrefix}/${creditUrl}`,
        label: i18n._(msg`Header.Credit`),
        project: 'trade',
      },
      leaderboard: {
        link: appPublicDisabled
          ? ''
          : `${tradeHost}${localPrefix}/${leaderboardUrl}`,
        label: i18n._(msg`Header.Leaderboard`),
        project: 'trade',
      },
      launch: {
        link: appPublicDisabled
          ? ''
          : `${tradeHost}${localPrefix}/${launchUrl}`,
        label: i18n._(msg`Header.Launch`),
        project: 'trade',
      },
    };
  }, [locale]);
};
