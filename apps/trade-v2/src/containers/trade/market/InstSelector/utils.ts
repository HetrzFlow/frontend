import { BN, calc } from '@repo/lib/calc';
import type { TickerType, Inst } from '@/common';
import { SORT_KEY } from './const';

const TOP_INSTS = ['BTC/USD', 'ETH/USD', 'USD/JPY', 'SOL/USD', 'BNB/USD'];

export const normalizeMarketSearch = (value: string) =>
  value
    .toLowerCase()
    .replace('/usd', '')
    .replace('usd/', '')
    .replace(/[^a-z0-9]/g, '');

export const getMarketSearchRank = (name: string, searchKey: string) => {
  if (!searchKey) {
    return 0;
  }

  const normalizedName = normalizeMarketSearch(name);
  if (normalizedName === searchKey) {
    return 3;
  }
  if (normalizedName.startsWith(searchKey)) {
    return 2;
  }
  if (normalizedName.includes(searchKey)) {
    return 1;
  }
  return 0;
};

// sort function
export const sortFn = (
  a: Inst,
  b: Inst,
  {
    tickersMap,
    marketsStats,
    sortKey,
    sorts,
    favorites,
  }: {
    tickersMap: Record<string, TickerType>;
    marketsStats: Record<
      string,
      { liqLong: BN; liqShort: BN; oiLong: BN; oiShort: BN }
    >;
    sortKey: SORT_KEY | '';
    sorts: Record<string, string>;
    favorites: Map<string, boolean>;
  },
) => {
  const aIsFavorite = favorites.get(a.marketTokenAddress) || false;
  const bIsFavorite = favorites.get(b.marketTokenAddress) || false;
  if (aIsFavorite !== bIsFavorite) {
    return aIsFavorite ? -1 : 1;
  }

  const aTickerData = tickersMap[a.marketTokenAddress] || tickersMap[a.symbol];
  const bTickerData = tickersMap[b.marketTokenAddress] || tickersMap[b.symbol];
  const aMarketStats = marketsStats[a.marketTokenAddress];
  const bMarketStats = marketsStats[b.marketTokenAddress];

  if (sortKey && sorts[sortKey]) {
    const factor = sorts[sortKey] === 'desc' ? 1 : -1;
    if ([SORT_KEY.price, SORT_KEY.chg, SORT_KEY.vol].includes(sortKey)) {
      if (aTickerData && bTickerData) {
        switch (sortKey) {
          case SORT_KEY.price:
            return (
              (calc(aTickerData.current_price).gt(bTickerData.current_price)
                ? -1
                : 1) * factor
            );
          case SORT_KEY.chg: {
            const aChg = calc(aTickerData.current_price)
              .minus(aTickerData.open_24h)
              .div(aTickerData.open_24h);
            const bChg = calc(bTickerData.current_price)
              .minus(bTickerData.open_24h)
              .div(bTickerData.open_24h);
            return (calc(aChg).gt(bChg) ? -1 : 1) * factor;
          }
          case SORT_KEY.vol:
            return (
              (calc(aTickerData.volume_24h).gt(bTickerData.volume_24h)
                ? -1
                : 1) * factor
            );
          default:
            break;
        }
      } else if (aTickerData) {
        return -1 * factor;
      } else if (bTickerData) {
        return 1 * factor;
      }
    }
    if ([SORT_KEY.oi, SORT_KEY.liq].includes(sortKey)) {
      if (aMarketStats && bMarketStats) {
        switch (sortKey) {
          case SORT_KEY.oi:
            return (
              (calc(aMarketStats?.oiLong)
                .plus(aMarketStats?.oiShort)
                .gt(calc(bMarketStats.oiLong).plus(bMarketStats.oiShort))
                ? -1
                : 1) * factor
            );
          case SORT_KEY.liq:
            return (
              (calc(aMarketStats.liqLong)
                .plus(aMarketStats.liqShort)
                .gt(calc(bMarketStats.liqLong).plus(bMarketStats.liqShort))
                ? -1
                : 1) * factor
            );
          default:
            break;
        }
      } else if (aMarketStats) {
        return -1 * factor;
      } else if (bMarketStats) {
        return 1 * factor;
      }
    }
  }

  const aTopIndex = TOP_INSTS.indexOf(a.symbol);
  const bTopIndex = TOP_INSTS.indexOf(b.symbol);
  if (aTopIndex > -1 || bTopIndex > -1) {
    if (aTopIndex === -1) {
      return 1;
    }
    if (bTopIndex === -1) {
      return -1;
    }
    return aTopIndex - bTopIndex;
  }

  if (
    aMarketStats?.oiLong &&
    aMarketStats.oiShort &&
    aMarketStats.liqLong &&
    aMarketStats.liqShort &&
    bMarketStats?.oiLong &&
    bMarketStats.oiShort &&
    bMarketStats.liqLong &&
    bMarketStats.liqShort
  ) {
    //  rankKey = liquidity * 0.6 + OI * 0.4 desc; alphabet asc
    const aRank = calc(aMarketStats.liqLong)
      .plus(aMarketStats.liqShort)
      .times(0.6)
      .plus(calc(aMarketStats.oiLong).plus(aMarketStats.oiShort).times(0.4));
    const bRank = calc(bMarketStats.liqLong)
      .plus(bMarketStats.liqShort)
      .times(0.6)
      .plus(calc(bMarketStats.oiLong).plus(bMarketStats.oiShort).times(0.4));
    return calc(aRank).gt(bRank) ? -1 : 1;
  }

  return a.symbol.localeCompare(b.symbol);
};
