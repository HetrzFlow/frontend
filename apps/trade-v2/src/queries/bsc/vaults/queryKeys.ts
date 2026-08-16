import { getAddress } from 'viem';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

const invalidatedHzvInputVersions = new WeakMap<
  QueryClient,
  Map<string, number>
>();

export function normalizeAddressSet(addresses: readonly string[]) {
  return Array.from(
    new Set(addresses.map((address) => getAddress(address))),
  ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export const hzvValuesQueryKey = (
  chainId: number | undefined,
  vaultAddresses: readonly string[],
) =>
  [
    'hz-sdk',
    'hzv-values',
    chainId,
    normalizeAddressSet(vaultAddresses).join(','),
  ] as const;

export const hzvValueQueryKey = (
  chainId: number | undefined,
  vaultAddress: string | undefined,
  marketAddresses: readonly string[],
) =>
  [
    'hz-sdk',
    'hzv-value',
    chainId,
    vaultAddress ? getAddress(vaultAddress) : undefined,
    normalizeAddressSet(marketAddresses).join(','),
  ] as const;

export function shouldInvalidateHzvValues({
  inputsAreFetching,
  inputsHaveError,
  inputsUpdatedAt,
  queryUpdatedAt,
  lastInvalidatedAt,
}: {
  inputsAreFetching: boolean;
  inputsHaveError: boolean;
  inputsUpdatedAt: number;
  queryUpdatedAt: number;
  lastInvalidatedAt: number;
}) {
  return (
    !inputsAreFetching &&
    !inputsHaveError &&
    inputsUpdatedAt > 0 &&
    inputsUpdatedAt > queryUpdatedAt &&
    inputsUpdatedAt > lastInvalidatedAt
  );
}

export async function invalidateHzvValuesIfNeeded({
  queryClient,
  queryKey,
  inputsAreFetching,
  inputsHaveError,
  inputsUpdatedAt,
  queryUpdatedAt,
}: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  inputsAreFetching: boolean;
  inputsHaveError: boolean;
  inputsUpdatedAt: number;
  queryUpdatedAt: number;
}) {
  const queryKeyHash = JSON.stringify(queryKey);
  let invalidatedVersions = invalidatedHzvInputVersions.get(queryClient);
  if (!invalidatedVersions) {
    invalidatedVersions = new Map<string, number>();
    invalidatedHzvInputVersions.set(queryClient, invalidatedVersions);
  }

  if (
    !shouldInvalidateHzvValues({
      inputsAreFetching,
      inputsHaveError,
      inputsUpdatedAt,
      queryUpdatedAt,
      lastInvalidatedAt: invalidatedVersions.get(queryKeyHash) ?? 0,
    })
  ) {
    return false;
  }

  invalidatedVersions.set(queryKeyHash, inputsUpdatedAt);
  try {
    await queryClient.invalidateQueries({
      queryKey,
      exact: true,
      refetchType: 'active',
    });
    return true;
  } catch {
    if (invalidatedVersions.get(queryKeyHash) === inputsUpdatedAt) {
      invalidatedVersions.delete(queryKeyHash);
    }
    return false;
  }
}
