import { LatestHZLPDetailResponse } from '@hertzflow/sdk';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { normalizeStructTag } from '@mysten/sui/utils';
import { useInfiniteQuery, useQuery } from '@repo/lib/queryClient';
import { IMAGES_MAP } from '../../assets';
import { useHzSdk } from '../../chainClient/hooks';

export type HZLPDetailRes = { icon: string } & LatestHZLPDetailResponse;

// HZLP detail
export const useHzLPDetail = (enabled = true) => {
  const hzSdk = useHzSdk();
  return useQuery({
    queryKey: ['rest', 'latestHZLPDetail', hzSdk.fullClient.network],
    enabled,
    queryFn: async () => {
      const data = await hzSdk.ApiModule.fetchLatestHZLPDetail();
      return {
        ...data,
        icon: IMAGES_MAP.coinIcons.HzLP,
        coin_type: normalizeStructTag(data.coin_type),
      } as HZLPDetailRes;
    },
    refetchInterval: 60000,
  });
};

export type HzLPHistory = {
  id: string;
  payCoinType: string;
  payCoinAmount: string;
  receiveCoinType: string;
  receiveCoinAmount: string;
  timestamp: number;
  digest: string;
};

const PAGE_SIZE = 10;

// HzLP liquidity history
export const useHzLPLiquidityHistory = () => {
  const hzSdk = useHzSdk();
  return useQuery({
    queryKey: ['liquidity-history'],
    queryFn: async () => {
      const data = await hzSdk.ApiModule.fetchHzLPLiquidityHistory();
      return data;
    },
  });
};
// HzLP trade records
export const useUserHzLPActivity = () => {
  const currentAccount = useCurrentAccount();
  const hzSdk = useHzSdk();
  return useInfiniteQuery({
    queryKey: [
      'rest',
      'userHzLPActivity',
      currentAccount?.address,
      hzSdk.fullClient.network,
    ],
    enabled: !!currentAccount?.address,
    queryFn: async ({ pageParam = 1 }) => {
      const data = await hzSdk.ApiModule.fetchUserHzLPActivity({
        user_addr: currentAccount!.address,
        page: pageParam,
        page_size: PAGE_SIZE,
      });

      data?.items.forEach((v) => {
        v.input_coin = normalizeStructTag(v.input_coin);
        v.output_coin = normalizeStructTag(v.output_coin);
      });

      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage?.page && lastPage.page * PAGE_SIZE < lastPage.total) {
        return pages.length + 1;
      }
      return undefined;
    },
  });
};
