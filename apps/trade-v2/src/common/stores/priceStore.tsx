import {
  getInternalUsdParamsForMarketTokens,
  type InternalUsdChainConfig,
} from '@hertzflow/sdk-v2/configs/internalUsd';
import { TokenPrices } from '@hertzflow/sdk-v2/types/tokens';
import { zeroAddress } from 'viem';
import { create } from 'zustand';

import { normalizeUsdPriceSymbol } from '../constants';

const PRICE_RANGE_BASIS_POINTS = 10_000n;
const PRICE_RANGE_OFFSET_BASIS_POINTS = 5n;

export type PriceTickerStoreItem = {
  t: number;
  s: string;
  p: string;
  minPrice?: string;
  maxPrice?: string;
  n: string;
  d: string;
  i: string;
  prevLast?: string;
  isLiveUp?: boolean;
  isLiveDown?: boolean;
};

export type TickerType = {
  current_price: string;
  high_24h: string;
  low_24h: string;
  open_24h: string;
  symbol: string;
  volume_24h: string;
  market_address: string;
};

type State = {
  pricesMap: Record<string, TokenPrices>;
  priceTickers: Record<string, PriceTickerStoreItem[] | undefined>;
  tickers: TickerType[];
  tickersByMarketAddress: Record<string, TickerType>;
  tickersBySymbol: Record<string, TickerType>;
};

type PriceInstLike = {
  symbol?: string;
  category?: string;
  indexTokenAddress?: string;
  longTokenAddress?: string;
  shortTokenAddress?: string;
};

type PriceCoinLike = {
  address?: string;
  symbol?: string;
  isWrapped?: boolean;
};

type PriceExpansionContext = {
  chainId?: number;
  insts: PriceInstLike[];
  coins: Record<string, PriceCoinLike | undefined>;
};

type InternalUsdPricePair = {
  underlyingTokenAddress: string;
  wrappedTokenAddress: string;
};

type PriceInstIndex = {
  indexTokenAddressesBySymbol: Map<string, string[]>;
  creditTokenAddresses: string[];
};

const priceInstIndexCache = new WeakMap<PriceInstLike[], PriceInstIndex>();

type Action = {
  setState: (state: Partial<State>) => void;
  setAggregatedPricesMap: (
    pricesMap: Record<string, TokenPrices>,
    context?: PriceExpansionContext,
  ) => void;
  setSymbolPrice: (
    symbol: string,
    price: TokenPrices,
    context: PriceExpansionContext,
  ) => void;
  setPriceTicker: (
    symbol: string,
    ticker: PriceTickerStoreItem[] | undefined,
  ) => void;
  setTickers: (tickers: TickerType[]) => void;
};

export function getBoundedTokenPricesFromAggregatePrice(
  price: bigint,
): TokenPrices {
  if (price <= 0n) {
    return {
      minPrice: price,
      maxPrice: price,
    };
  }

  return {
    minPrice:
      (price * (PRICE_RANGE_BASIS_POINTS - PRICE_RANGE_OFFSET_BASIS_POINTS)) /
      PRICE_RANGE_BASIS_POINTS,
    maxPrice:
      (price * (PRICE_RANGE_BASIS_POINTS + PRICE_RANGE_OFFSET_BASIS_POINTS)) /
      PRICE_RANGE_BASIS_POINTS,
  };
}

export function getAggregatePriceFromTokenPrices(
  prices: TokenPrices | undefined,
): bigint | undefined {
  if (!prices) return undefined;
  if (prices.minPrice > 0n && prices.maxPrice > 0n) {
    return (prices.minPrice + prices.maxPrice) / 2n;
  }
  if (prices.maxPrice > 0n) return prices.maxPrice;
  if (prices.minPrice > 0n) return prices.minPrice;
  return prices.maxPrice || prices.minPrice;
}

function getPrimarySymbolFromInstSymbol(symbol?: string) {
  if (!symbol) return '';
  if (symbol.endsWith('/USD')) {
    return symbol.replace('/USD', '');
  }
  if (symbol.startsWith('USD/')) {
    return symbol.replace('USD/', '');
  }
  return '';
}

function getPriceByAddress(
  pricesMap: Record<string, TokenPrices>,
  address?: string,
) {
  return address ? pricesMap[address] : undefined;
}

function setPriceByAddress(
  pricesMap: Record<string, TokenPrices>,
  address: string | undefined,
  price: TokenPrices,
) {
  if (!address) return;
  pricesMap[address] = price;
}

function getTokenAddressBySymbol(
  coins: Record<string, PriceCoinLike | undefined>,
  symbol: string,
) {
  return (
    coins[symbol]?.address ??
    Object.values(coins).find((coin) => coin?.symbol === symbol)?.address
  );
}

function getPriceInstIndex(insts: PriceInstLike[]) {
  const cachedIndex = priceInstIndexCache.get(insts);
  if (cachedIndex) return cachedIndex;

  const indexTokenAddressesBySymbol = new Map<string, string[]>();
  const creditTokenAddresses: string[] = [];

  insts.forEach((inst) => {
    if (inst.symbol && inst.indexTokenAddress) {
      const addresses = indexTokenAddressesBySymbol.get(inst.symbol);
      if (addresses) {
        addresses.push(inst.indexTokenAddress);
      } else {
        indexTokenAddressesBySymbol.set(inst.symbol, [inst.indexTokenAddress]);
      }
    }

    if (inst.category === 'credit') {
      if (inst.longTokenAddress) {
        creditTokenAddresses.push(inst.longTokenAddress);
      }
      if (inst.shortTokenAddress) {
        creditTokenAddresses.push(inst.shortTokenAddress);
      }
    }
  });

  const index = {
    indexTokenAddressesBySymbol,
    creditTokenAddresses,
  };
  priceInstIndexCache.set(insts, index);
  return index;
}

function setCreditTokenPriceAliases({
  pricesMap,
  creditTokenAddresses,
  coins,
}: {
  pricesMap: Record<string, TokenPrices>;
  creditTokenAddresses: string[];
  coins: Record<string, PriceCoinLike | undefined>;
}) {
  const usdtPrice = getPriceByAddress(
    pricesMap,
    getTokenAddressBySymbol(coins, 'USDT'),
  );
  if (!usdtPrice) return;

  creditTokenAddresses.forEach((address) => {
    setPriceByAddress(pricesMap, address, usdtPrice);
  });
}

function getInternalUsdPricePairs({
  chainId,
  insts,
}: Pick<PriceExpansionContext, 'chainId' | 'insts'>) {
  if (!chainId) return [];

  const seenWrappedTokens = new Set<string>();

  return insts.reduce<InternalUsdPricePair[]>((pairs, inst) => {
    const internalUsd = getInternalUsdParamsForMarketTokens({
      chainId,
      longTokenAddress: inst.longTokenAddress,
      shortTokenAddress: inst.shortTokenAddress,
    });
    if (!internalUsd?.underlyingTokenAddress) return pairs;

    const wrappedTokenKey = internalUsd.wrappedTokenAddress.toLowerCase();
    if (seenWrappedTokens.has(wrappedTokenKey)) return pairs;

    seenWrappedTokens.add(wrappedTokenKey);
    pairs.push({
      underlyingTokenAddress: internalUsd.underlyingTokenAddress,
      wrappedTokenAddress: internalUsd.wrappedTokenAddress,
    });
    return pairs;
  }, []);
}

function setInternalUsdPriceAliases({
  pricesMap,
  ...context
}: {
  pricesMap: Record<string, TokenPrices>;
} & Pick<PriceExpansionContext, 'chainId' | 'insts'>) {
  getInternalUsdPricePairs(context).forEach(
    ({ underlyingTokenAddress, wrappedTokenAddress }) => {
      const underlyingPrice = getPriceByAddress(
        pricesMap,
        underlyingTokenAddress,
      );
      if (!underlyingPrice) return;

      setPriceByAddress(pricesMap, wrappedTokenAddress, underlyingPrice);
    },
  );
}

export function expandPricesMapByInstSymbol({
  pricesMap,
  insts,
  coins,
  chainId,
}: {
  pricesMap: Record<string, TokenPrices>;
} & PriceExpansionContext) {
  const expandedPricesMap = { ...pricesMap };
  const { indexTokenAddressesBySymbol, creditTokenAddresses } =
    getPriceInstIndex(insts);

  indexTokenAddressesBySymbol.forEach((indexTokenAddresses, symbol) => {
    const existingPriceAddress = indexTokenAddresses.find((address) =>
      getPriceByAddress(expandedPricesMap, address),
    );
    const primarySymbol = getPrimarySymbolFromInstSymbol(symbol);
    const primaryCoinAddress = primarySymbol
      ? getTokenAddressBySymbol(coins, primarySymbol)
      : '';
    const sourcePrice =
      getPriceByAddress(expandedPricesMap, existingPriceAddress) ??
      getPriceByAddress(expandedPricesMap, primaryCoinAddress);

    if (!sourcePrice) return;

    indexTokenAddresses.forEach((address) => {
      setPriceByAddress(expandedPricesMap, address, sourcePrice);
    });
  });

  setCreditTokenPriceAliases({
    pricesMap: expandedPricesMap,
    creditTokenAddresses,
    coins,
  });
  setInternalUsdPriceAliases({
    pricesMap: expandedPricesMap,
    chainId,
    insts,
  });

  return expandedPricesMap;
}

function patchSymbolPriceAliases({
  pricesMap,
  symbol,
  price,
  insts,
  coins,
  chainId,
}: {
  pricesMap: Record<string, TokenPrices>;
  symbol: string;
  price: TokenPrices;
} & PriceExpansionContext) {
  const coinSymbol = getPrimarySymbolFromInstSymbol(symbol);
  const coin = coinSymbol ? coins[coinSymbol] : undefined;
  const { indexTokenAddressesBySymbol, creditTokenAddresses } =
    getPriceInstIndex(insts);

  setPriceByAddress(pricesMap, coin?.address, price);

  if (coin?.isWrapped) {
    setPriceByAddress(pricesMap, zeroAddress, price);
  }

  indexTokenAddressesBySymbol.get(symbol)?.forEach((address) => {
    setPriceByAddress(pricesMap, address, price);
  });

  if (coinSymbol === 'USDT') {
    setCreditTokenPriceAliases({
      pricesMap,
      creditTokenAddresses,
      coins,
    });
  }

  setInternalUsdPriceAliases({ pricesMap, chainId, insts });
}

function getTickerIndexes(tickers: TickerType[]) {
  const tickersByMarketAddress: Record<string, TickerType> = {};
  const tickersBySymbol: Record<string, TickerType> = {};

  tickers.forEach((ticker) => {
    if (ticker.market_address) {
      tickersByMarketAddress[ticker.market_address] = ticker;
    }
    if (ticker.symbol) {
      tickersBySymbol[ticker.symbol] = ticker;
    }
  });

  return {
    tickersByMarketAddress,
    tickersBySymbol,
  };
}

export const usePriceStore = create<State & Action>((set, get) => {
  return {
    // store all markets and coins price
    pricesMap: {},
    priceTickers: {},
    tickers: [],
    tickersByMarketAddress: {},
    tickersBySymbol: {},
    setState: (state) => set(state),
    setAggregatedPricesMap: (pricesMap, context) =>
      set(() => {
        const boundedPricesMap = Object.fromEntries(
          Object.entries(pricesMap).map(([address, prices]) => [
            address,
            getBoundedTokenPricesFromAggregatePrice(
              getAggregatePriceFromTokenPrices(prices) ?? 0n,
            ),
          ]),
        );

        return {
          pricesMap: context
            ? expandPricesMapByInstSymbol({
                pricesMap: boundedPricesMap,
                ...context,
              })
            : boundedPricesMap,
        };
      }),
    setSymbolPrice: (symbol, price, context) => {
      // WS price ticks should update the imperative cache without notifying pricesMap subscribers.
      patchSymbolPriceAliases({
        pricesMap: get().pricesMap,
        symbol,
        price,
        ...context,
      });
    },
    setPriceTicker: (symbol, ticker) =>
      set((state) => {
        const normalizedSymbol = normalizeUsdPriceSymbol(symbol);
        if (state.priceTickers[normalizedSymbol] === ticker) return state;
        return {
          priceTickers: {
            ...state.priceTickers,
            [normalizedSymbol]: ticker,
          },
        };
      }),
    setTickers: (tickers) =>
      set(() => ({
        tickers,
        ...getTickerIndexes(tickers),
      })),
  };
});

function getPriceByAddressIgnoreCase(
  pricesMap: Record<string, TokenPrices>,
  address: string,
) {
  return (
    pricesMap[address] ??
    pricesMap[address.toLowerCase()] ??
    Object.entries(pricesMap).find(
      ([key]) => key.toLowerCase() === address.toLowerCase(),
    )?.[1]
  );
}

export function syncInternalUsdPriceAliases(
  configs: readonly InternalUsdChainConfig[],
) {
  const currentPricesMap = usePriceStore.getState().pricesMap;
  let nextPricesMap: Record<string, TokenPrices> | undefined;

  for (const config of configs) {
    const price = getPriceByAddressIgnoreCase(
      currentPricesMap,
      config.underlyingTokenAddress,
    );
    if (!price) continue;

    if (!currentPricesMap[config.underlyingTokenAddress]) {
      nextPricesMap ??= { ...currentPricesMap };
      nextPricesMap[config.underlyingTokenAddress] = price;
    }
    if (!currentPricesMap[config.wrappedTokenAddress]) {
      nextPricesMap ??= { ...currentPricesMap };
      nextPricesMap[config.wrappedTokenAddress] = price;
    }
  }

  if (nextPricesMap) {
    usePriceStore.getState().setState({ pricesMap: nextPricesMap });
  }
}
