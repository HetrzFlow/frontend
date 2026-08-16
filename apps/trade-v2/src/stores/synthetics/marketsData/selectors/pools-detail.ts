import { useMemo } from 'react';
import { useHydrated } from '@/common/hooks/useHydrated';
import { useMarketValues } from '@/common/services/rest/market';
import { usePoolDetail } from '@/queries/bsc/pools';
import type { PoolDetailQueryData } from '@/queries/bsc/pools';

export function usePoolTvlUsd(
  marketAddress: string | undefined,
  initialData?: PoolDetailQueryData,
): bigint | undefined {
  const isHydrated = useHydrated();
  const { data: marketValues } = useMarketValues(
    marketAddress ? { marketTokenAddress: marketAddress } : undefined,
    false,
    { enabled: true },
  );
  const { data: poolDetail } = usePoolDetail(marketAddress ?? '', {
    initialData,
  });
  const poolDetailData = !isHydrated && initialData ? initialData : poolDetail;

  return useMemo(() => {
    if (!marketAddress) return undefined;
    const chainValue = isHydrated ? marketValues?.poolValueMin : undefined;
    const backendValue = poolDetailData?.pool?.tvl_usd;
    let parsedBackendValue: bigint | undefined;

    if (backendValue !== undefined) {
      try {
        parsedBackendValue = BigInt(backendValue);
      } catch {
        parsedBackendValue = undefined;
      }
    }

    return chainValue ?? parsedBackendValue;
  }, [isHydrated, marketAddress, marketValues, poolDetailData?.pool?.tvl_usd]);
}
