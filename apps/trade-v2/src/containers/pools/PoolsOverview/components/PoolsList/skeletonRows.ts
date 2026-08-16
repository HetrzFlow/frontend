import type { PoolsListItem } from '@/stores/synthetics/marketTokens/selectors';

const POOLS_LIST_SKELETON_ROW_COUNT = 10;

export const poolsListSkeletonRows: PoolsListItem[] = Array.from(
  { length: POOLS_LIST_SKELETON_ROW_COUNT },
  () => ({
    category: undefined,
    displayName: undefined,
    symbol: undefined,
    marketAddress: undefined,
    indexTokenAddress: undefined,
    longTokenAddress: undefined,
    shortTokenAddress: undefined,
    tvl: undefined,
    supply: undefined,
    feeApy: undefined,
    aprHistory: undefined,
  }),
);
