import {
  getMarkPrice,
  getShouldUseMaxPrice,
} from '@hertzflow/sdk-v2/utils/prices';
import { calc } from '@repo/lib/calc';
import { CONTRACT_USD_MULTIPLIER } from '@/common/constants';
import {
  getCachedPriceTickerData,
  usePriceTickerStream,
} from '@/common/services/ws/tickers';
import { usePriceStore } from '@/common/stores/priceStore';
import type { PriceTickerStoreItem } from '@/common/stores/priceStore';
import type { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';

export type ExecutionPriceType = 'mark' | 'min' | 'max' | 'aggregate';

export function formatExecutionPrice(prices: TokenPrices | undefined, p: {
  isIncrease: boolean;
  isLong: boolean;
  priceType?: ExecutionPriceType;
}) {
  if (!prices) return '';
  const price = getTokenExecutionPrice(prices, p);

  if (price <= 0n) return '';

  return calc(price.toString())
    .div(CONTRACT_USD_MULTIPLIER)
    .toFixed();
}

export function getCachedMarketExecutionPrice({
  symbol,
  indexTokenAddress,
  isIncrease,
  isLong,
  priceType,
}: {
  symbol?: string;
  indexTokenAddress?: string;
  isIncrease: boolean;
  isLong: boolean;
  priceType?: ExecutionPriceType;
}) {
  const tickerPrice = getTickerExecutionPrice(symbol, {
    isIncrease,
    isLong,
    priceType,
  });
  if (tickerPrice) return tickerPrice;
  if (!indexTokenAddress) return '';

  return formatExecutionPrice(
    usePriceStore.getState().pricesMap[indexTokenAddress],
    {
      isIncrease,
      isLong,
      priceType,
    },
  );
}

export function useMarketExecutionPrice({
  symbol,
  indexTokenAddress,
  isIncrease,
  isLong,
  priceType,
}: {
  symbol?: string;
  indexTokenAddress?: string;
  isIncrease: boolean;
  isLong: boolean;
  priceType?: ExecutionPriceType;
}) {
  const tickerPrice = usePriceTickerExecutionPrice({
    symbol,
    isIncrease,
    isLong,
    priceType,
  });

  if (tickerPrice) return tickerPrice;

  return formatExecutionPrice(
    indexTokenAddress
      ? usePriceStore.getState().pricesMap[indexTokenAddress]
      : undefined,
    { isIncrease, isLong, priceType },
  );
}

export function useMarketActionAndCloseExecutionPrices({
  symbol,
  indexTokenAddress,
  isIncrease,
  isLong,
  throttleWait,
}: {
  symbol?: string;
  indexTokenAddress?: string;
  isIncrease: boolean;
  isLong: boolean;
  throttleWait?: number;
}) {
  const actionExecutionPx = usePriceTickerExecutionPrice({
    symbol,
    isIncrease,
    isLong,
    throttleWait,
  });
  const closeExecutionPx = usePriceTickerExecutionPrice({
    symbol,
    isIncrease: false,
    isLong,
    throttleWait,
  });

  return {
    actionExecutionPx:
      actionExecutionPx ||
      getCachedMarketExecutionPrice({
        symbol,
        indexTokenAddress,
        isIncrease,
        isLong,
      }),
    closeExecutionPx:
      closeExecutionPx ||
      getCachedMarketExecutionPrice({
        symbol,
        indexTokenAddress,
        isIncrease: false,
        isLong,
      }),
  };
}

export function usePriceTickerExecutionPrice({
  symbol,
  isIncrease,
  isLong,
  throttleWait,
  priceType,
}: {
  symbol?: string;
  isIncrease: boolean;
  isLong: boolean;
  throttleWait?: number;
  priceType?: ExecutionPriceType;
}) {
  const ticker = usePriceTickerStream(symbol, { throttleWait }).data[0];

  return getPriceTickerExecutionPrice(ticker, { isIncrease, isLong, priceType });
}

export function getPriceTickerExecutionPrice(
  ticker: PriceTickerStoreItem | undefined,
  p: {
    isIncrease: boolean;
    isLong: boolean;
    priceType?: ExecutionPriceType;
  },
) {
  if (!ticker) return '';

  const price = getTickerPriceByType(ticker, p);

  if (!price || calc(price).lte(0)) return '';

  return price;
}

export function getCachedPriceTickerExecutionPrice(
  symbol: string | undefined,
  p: {
    isIncrease: boolean;
    isLong: boolean;
    priceType?: ExecutionPriceType;
  },
) {
  return getPriceTickerExecutionPrice(getCachedPriceTickerData(symbol)?.[0], p);
}

function getTokenExecutionPrice(
  prices: TokenPrices,
  p: {
    isIncrease: boolean;
    isLong: boolean;
    priceType?: ExecutionPriceType;
  },
) {
  if (p.priceType === 'min') return prices.minPrice;
  if (p.priceType === 'max') return prices.maxPrice;
  if (p.priceType === 'aggregate') {
    return (prices.minPrice + prices.maxPrice) / 2n;
  }

  return getMarkPrice({
    prices,
    isIncrease: p.isIncrease,
    isLong: p.isLong,
  });
}

function getTickerPriceByType(
  ticker: PriceTickerStoreItem,
  p: {
    isIncrease: boolean;
    isLong: boolean;
    priceType?: ExecutionPriceType;
  },
) {
  if (p.priceType === 'min') return ticker.minPrice;
  if (p.priceType === 'max') return ticker.maxPrice;
  if (p.priceType === 'aggregate') return ticker.p;

  return getShouldUseMaxPrice(p.isIncrease, p.isLong)
    ? ticker.maxPrice
    : ticker.minPrice;
}

function getTickerExecutionPrice(
  symbol: string | undefined,
  p: {
    isIncrease: boolean;
    isLong: boolean;
    priceType?: ExecutionPriceType;
  },
) {
  return getCachedPriceTickerExecutionPrice(symbol, p);
}
