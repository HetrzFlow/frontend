import { useMemo } from 'react';
import { getAddress, type Address } from 'viem';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { STATIC_CONFIG_CACHE_TIME } from '@/common/constants/timeConstants';
import { useHzvValues, useVaultsList } from '@/queries/bsc/vaults';
import type { HzvValues } from '@/queries/bsc/vaults';
import type {
  VaultItem,
  GlobalStatus,
  fetchVaultsList,
} from '@/services/rest/vaults';

export function getByAddress<T>(
  map: Record<string, T> | undefined,
  address: string,
): T | undefined {
  if (!map) return undefined;
  const checksum = getAddress(address);
  return (
    map[checksum] ??
    map[address] ??
    map[checksum.toLowerCase()] ??
    map[address.toLowerCase()]
  );
}

export function parseRawValue(value?: string | bigint | null) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'bigint') return value;
  try {
    const str = String(value).trim();
    if (!str) return undefined;
    if (/^-?\d+$/.test(str)) return BigInt(str);
    if (!/^-?\d+(\.\d+)?$/.test(str)) return undefined;
    return BigInt(calc(str).integerValue(ROUND_MODE.DOWN).toFixed(0));
  } catch {
    return undefined;
  }
}

export function getVaultListItem(
  vaultsList: VaultItem[] | undefined,
  vaultAddress: string | undefined,
): VaultItem | undefined {
  if (!vaultsList?.length || !vaultAddress) return undefined;
  const targetAddress = vaultAddress.toLowerCase();
  return vaultsList.find((item) => item.vault_address.toLowerCase() === targetAddress);
}

type VaultHoldingsLike = Pick<VaultItem, 'tokens_balance' | 'supply' | 'tvl'>;

export function calculateVaultRestHoldingsUsd(
  vault?: Partial<VaultHoldingsLike> | null,
): bigint | undefined {
  if (!vault) return undefined;
  const tokensBalance = parseRawValue(vault.tokens_balance);
  if (tokensBalance === 0n) return 0n;
  const supply = parseRawValue(vault.supply);
  const tvl = parseRawValue(vault.tvl);
  if (tokensBalance === undefined || supply === undefined || tvl === undefined) {
    return undefined;
  }
  if (supply <= 0n) return undefined;
  return (tokensBalance * tvl) / supply;
}

type PoolHoldingsLike = { tokens_balance?: string; lp_supply?: string; tvl_usd?: string };

const LP_TOKEN_SCALE = 10n ** 18n;

type DepositCostBasisLike = {
  average_deposit_price?: string;
  tokens_balance?: string;
};

export function calculateDepositCostBasisUsd(
  item?: Partial<DepositCostBasisLike> | null,
): bigint | undefined {
  if (!item) return undefined;
  const averageDepositPrice = parseRawValue(item.average_deposit_price);
  const tokensBalance = parseRawValue(item.tokens_balance);
  if (tokensBalance === 0n) return 0n;
  if (averageDepositPrice === undefined || tokensBalance === undefined) {
    return undefined;
  }
  return (averageDepositPrice * tokensBalance) / LP_TOKEN_SCALE;
}

export function calculatePoolRestHoldingsUsd(
  pool?: Partial<PoolHoldingsLike> | null,
): bigint | undefined {
  if (!pool) return undefined;
  const tokensBalance = parseRawValue(pool.tokens_balance);
  if (tokensBalance === 0n) return 0n;
  const supply = parseRawValue(pool.lp_supply);
  const tvl = parseRawValue(pool.tvl_usd);
  if (tokensBalance === undefined || supply === undefined || tvl === undefined) {
    return undefined;
  }
  if (supply <= 0n) return undefined;
  return (tokensBalance * tvl) / supply;
}

type RefetchOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
  marketAddresses?: Address[];
  vaultAddresses?: Address[];
};

export function useHzvValuesData({
  enabled = true,
  refetchInterval = false,
  marketAddresses,
  vaultAddresses,
}: RefetchOptions = {}):
  | Record<Address, HzvValues>
  | undefined {
  const defaultMarketAddresses = useVaultsMarketTokenAddresses();
  const defaultVaultAddresses = useViewedVaultAddresses();
  const { data } = useHzvValues({
    enabled,
    refetchInterval,
    marketAddresses: marketAddresses ?? defaultMarketAddresses,
    vaultAddresses: vaultAddresses ?? defaultVaultAddresses,
  });
  return data;
}

type VaultsListInitialData = Awaited<ReturnType<typeof fetchVaultsList>>['data'];

export function useVaultsListData(
  initialData?: VaultsListInitialData,
  { refetchInterval = STATIC_CONFIG_CACHE_TIME }: RefetchOptions = {},
): VaultItem[] | undefined {
  const { data } = useVaultsList({
    enabled: true,
    refetchInterval,
    refetchOnWindowFocus: false,
    initialData,
  });
  return data?.items;
}

export function useVaultsGlobalStats(
  initialData?: VaultsListInitialData,
): GlobalStatus | undefined {
  const { data } = useVaultsList({
    enabled: true,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    initialData,
  });
  return data?.global_stats;
}

export function useVaultsMarketTokenAddresses(
  allowedVaultAddresses?: readonly string[],
): Address[] {
  const vaultsList = useVaultsListData();
  const allowedVaultAddressSet = useMemo(
    () =>
      allowedVaultAddresses
        ? new Set(allowedVaultAddresses.map((address) => address.toLowerCase()))
        : undefined,
    [allowedVaultAddresses],
  );
  return useMemo(() => {
    if (!vaultsList) return [];
    const addresses = new Set<Address>();
    vaultsList.forEach((vault) => {
      if (!vault.is_view) return;
      if (
        allowedVaultAddressSet &&
        !allowedVaultAddressSet.has(vault.vault_address.toLowerCase())
      ) {
        return;
      }
      (vault.market_exposure ?? []).forEach((item) => {
        if (!item.market_address) return;
        try {
          addresses.add(getAddress(item.market_address) as Address);
        } catch {
          addresses.add(item.market_address as Address);
        }
      });
    });
    return Array.from(addresses).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
  }, [allowedVaultAddressSet, vaultsList]);
}

export function useViewedVaultAddresses(
  allowedVaultAddresses?: readonly string[],
): Address[] {
  const vaultsList = useVaultsListData();
  const allowedVaultAddressSet = useMemo(
    () =>
      allowedVaultAddresses
        ? new Set(allowedVaultAddresses.map((address) => address.toLowerCase()))
        : undefined,
    [allowedVaultAddresses],
  );
  return useMemo(() => {
    if (!vaultsList) return [];
    return vaultsList.flatMap((vault) => {
      if (!vault.is_view || !vault.vault_address) return [];
      if (
        allowedVaultAddressSet &&
        !allowedVaultAddressSet.has(vault.vault_address.toLowerCase())
      ) {
        return [];
      }
      try {
        return [getAddress(vault.vault_address) as Address];
      } catch {
        return [];
      }
    });
  }, [allowedVaultAddressSet, vaultsList]);
}
