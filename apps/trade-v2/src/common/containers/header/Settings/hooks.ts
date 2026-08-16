import { usePathname } from 'next/navigation';

import { useLingui } from '@lingui/react/macro';
import { SUPPORTED_LOCALES } from '@repo/i18n/const';

const getNetworkOrigin = (host: string) =>
  host.includes('://') ? host.replace(/\/$/, '') : `https://${host}`;

const getNetworkPath = (
  locale: string,
  pathname: string,
) => {
  const segments = pathname.split('/').filter(Boolean);
  const routeSegments = SUPPORTED_LOCALES.includes(segments[0] ?? '')
    ? segments.slice(1)
    : segments;
  const route = routeSegments[0];

  if (route === 'trade' || route === 'pools' || route === 'vaults') {
    return `/${locale}/${route}`;
  }

  return pathname;
};

const getNetworkHref = (
  network: 'testnet' | 'mainnet',
  locale: string,
  pathname: string,
) => {
  const host =
    network === 'testnet'
      ? process.env.NEXT_PUBLIC_TESTNET_HOST
      : process.env.NEXT_PUBLIC_MAINNET_HOST;

  if (!host) return undefined;

  return `${getNetworkOrigin(host)}${getNetworkPath(locale, pathname)}`;
};

export const useNetworks = () => {
  const { i18n, t } = useLingui();
  const pathname = usePathname();
  const locale = i18n.locale || 'en';

  return [
    {
      key: 'testnet',
      label: t`Testnet`,
      href: getNetworkHref('testnet', locale, pathname),
    },
    {
      key: 'mainnet',
      label: t`Mainnet`,
      href: getNetworkHref('mainnet', locale, pathname),
    },
  ];
};
