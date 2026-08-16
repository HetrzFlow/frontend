import { getAddress } from 'viem';
import { calc } from '@repo/lib/calc';
import { queryClient, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { CONTRACT_USD_MULTIPLIER, useHzSdk } from '@/common';
import { usePriceStore, type TickerType } from '@/common/stores/priceStore';
import { fetchStatsTickers } from './stats';

export type { TickerType } from '@/common/stores/priceStore';

export type TickerResType = {
  data?: {
    prices?: TickerType[];
  };
};

type UseTickersOptions = {
  refetchInterval?: number | false;
};

type UseSingleTickerOptions = UseTickersOptions & {
  marketAddress?: string;
  symbol?: string;
};

// query tickers data
export function useTickers(options?: UseTickersOptions): ReturnType<
  typeof useTickersQuery
> & {
  data: TickerType[] | undefined;
  tickersByMarketAddress: Record<string, TickerType>;
  tickersBySymbol: Record<string, TickerType>;
};
export function useTickers(options: UseSingleTickerOptions): ReturnType<
  typeof useTickersQuery
> & {
  data: TickerType | undefined;
  tickersByMarketAddress: Record<string, TickerType>;
  tickersBySymbol: Record<string, TickerType>;
};
export function useTickers(options: UseSingleTickerOptions = {}) {
  const hzSdk = useHzSdk();
  const queryKey = ['rest', 'tickers', hzSdk?.chainId];
  const refetchInterval = options.refetchInterval ?? 60_000;
  const enabled = !!hzSdk;
  const marketAddress = options.marketAddress;
  const symbol = options.symbol;
  const tickers = usePriceStore((state) => state.tickers);
  const ticker = usePriceStore(
    (state) =>
      (marketAddress && state.tickersByMarketAddress[marketAddress]) ||
      (symbol && state.tickersBySymbol[symbol]) ||
      undefined,
  );
  const tickersByMarketAddress = usePriceStore(
    (state) => state.tickersByMarketAddress,
  );
  const tickersBySymbol = usePriceStore((state) => state.tickersBySymbol);

  const result = useTickersQuery({
    enabled,
    queryKey,
    refetchInterval,
  });

  return {
    ...result,
    data:
      marketAddress || symbol
        ? (ticker ?? getTickerFromList(result.data, { marketAddress, symbol }))
        : tickers.length
          ? tickers
          : result.data,
    tickersByMarketAddress,
    tickersBySymbol,
  };
}

function useTickersQuery({
  enabled,
  queryKey,
  refetchInterval,
}: {
  enabled: boolean;
  queryKey: (string | number | undefined)[];
  refetchInterval: number | false;
}) {
  return useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      try {
        const tickers = await fetchStatsTickers();

        tickers.forEach((v) => {
          v.volume_24h = calc(v.volume_24h)
            .div(CONTRACT_USD_MULTIPLIER)
            .toFixed();
          v.market_address = normalizeMarketAddress(v.market_address);
          if (v.market_address) {
            queryClient.setQueryData(['rest', 'ticker', v.market_address], v);
          }
          if (v.symbol) {
            queryClient.setQueryData(['rest', 'ticker', v.symbol], v);
          }
        });
        usePriceStore.getState().setTickers(tickers);

        return tickers;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-tickers' });
        throw error;
      }
    },
    staleTime: 60_000,
    refetchInterval,
    retryDelay: 2_000,
    retry: 1,
  });
}

function normalizeMarketAddress(marketAddress?: string) {
  if (!marketAddress) return '';

  try {
    return getAddress(marketAddress);
  } catch {
    return marketAddress;
  }
}

function getTickerFromList(
  tickers: TickerType[] | undefined,
  {
    marketAddress,
    symbol,
  }: {
    marketAddress?: string;
    symbol?: string;
  },
) {
  return tickers?.find(
    (ticker) =>
      (marketAddress && ticker.market_address === marketAddress) ||
      (symbol && ticker.symbol === symbol),
  );
}
