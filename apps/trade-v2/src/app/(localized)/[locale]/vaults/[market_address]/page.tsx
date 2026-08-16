import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance } from '@repo/i18n/server';
import VaultDetailLayoutEntry from '@/layouts/vaults-detail/entry';
import { toChecksumAddress, toValidChecksumAddress } from '@/lib/address';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';
import { fetchVaultsList } from '@/services/rest/vaults';

export const revalidate = 86400;
export const dynamicParams = true;

type VaultRouteItem = {
  vault_address?: string;
  is_view?: boolean;
};

let cachedVaultRouteAddresses: string[] | null = null;

function getVaultRouteAddresses(vaults: VaultRouteItem[]) {
  return [
    ...new Set(
      vaults
        .filter((vault) => vault.is_view ?? true)
        .map((vault) => toValidChecksumAddress(vault.vault_address))
        .filter((address) => address !== undefined),
    ),
  ];
}

async function fetchVaultRouteAddresses() {
  let requestFailed = false;

  const vaults = await fetchVaultsList({})
    .then((res) => res.data?.items ?? [])
    .catch(() => {
      requestFailed = true;
      return cachedVaultRouteAddresses
        ? cachedVaultRouteAddresses.map((vault_address) => ({
            vault_address,
          }))
        : [];
    });

  const addresses = getVaultRouteAddresses(vaults);
  if (!requestFailed || !cachedVaultRouteAddresses) {
    cachedVaultRouteAddresses = addresses;
  }

  return addresses;
}

async function getAllVaultRouteAddresses() {
  if (cachedVaultRouteAddresses) {
    void fetchVaultRouteAddresses();
    return cachedVaultRouteAddresses;
  }

  return await fetchVaultRouteAddresses();
}

interface VaultDetailPageProps {
  params: Promise<{
    locale: string;
    market_address: string;
  }>;
}

export async function generateStaticParams() {
  const addresses = await getAllVaultRouteAddresses();

  return linguiConfig.locales.flatMap((locale) =>
    addresses.map((market_address) => ({
      locale,
      market_address,
    })),
  );
}

export async function generateMetadata({ params }: VaultDetailPageProps) {
  const { locale, market_address } = await params;
  const i18n = getI18nInstance(locale, await getAllI18nInstances());
  const BASE_URL = getConfiguredSiteUrl();
  const canonicalVaultAddress = toChecksumAddress(market_address);

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const locBase = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
    languages[loc] = `${locBase}/vaults/${canonicalVaultAddress}`;
  }
  languages['x-default'] = `${BASE_URL}/en/vaults/${canonicalVaultAddress}`;

  const title = i18n._(msg`Vault Details | HertzFlow`);
  const description = i18n._(
    msg`View vault details, performance, and market exposure. Earn yield with diversified liquidity provision on HertzFlow.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/vaults/${canonicalVaultAddress}`,
      languages,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: `${SITE_URL}/vaults/${canonicalVaultAddress}`,
    },
    twitter: {
      ...HOME_TWITTER,
      title,
      description,
    },
  };
}

const VaultDetailPage = async ({ params }: VaultDetailPageProps) => {
  const { market_address, locale } = await params;
  const allI18nInstances = await getAllI18nInstances();
  const i18n = getI18nInstance(locale, allI18nInstances);
  const canonicalVaultAddress = toChecksumAddress(market_address);

  return (
    <>
      <h1 className="sr-only">{i18n._(msg`Vault Details`)}</h1>
      <VaultDetailLayoutEntry market_address={canonicalVaultAddress} />
    </>
  );
};

export default VaultDetailPage;
