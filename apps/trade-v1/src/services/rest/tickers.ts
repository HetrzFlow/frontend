import { queryClient, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useHzSdk } from '@/common';

import type { Price24hType } from '@hertzflow/sdk';

type TickerType = {
  symbol: string;
  priceOpen: string;
  high: string;
  low: string;
  volume: string;
};

export type TickerResType = {
  code: string;
  error?: string;
  data?: TickerType;
};

// query ticker data
export const useTicker = (instId?: string) => {
  useTickers();
  return useQuery<Price24hType | undefined | null>({
    queryKey: ['rest', 'ticker', instId],
    enabled: !!instId,
    queryFn: async () => {
      return queryClient.getQueryData(['rest', 'ticker', instId]) || null;
    },
  });
};

// query tickers data
export const useTickers = () => {
  const hzSdk = useHzSdk();
  return useQuery({
    queryKey: ['rest', 'tickers', hzSdk.fullClient.network],
    queryFn: async () => {
      try {
        const { items } = await hzSdk.ApiModule.fetch24hPrices();
        items?.forEach((v) => {
          queryClient.setQueryData(['rest', 'ticker', v.symbol], v);
        });

        return items || [];
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-tickers' });
        throw error;
      }
    },
    refetchInterval: 60000,
    retry: 1,
  });
};
