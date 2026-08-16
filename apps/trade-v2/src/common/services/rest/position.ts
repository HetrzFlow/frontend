import { useCallback, useMemo } from 'react';
import { Address } from 'viem';
import { create } from 'zustand';
import { calc } from '@repo/lib/calc';
import {
  type InfiniteData,
  queryClient,
  useInfiniteQuery,
  useQuery,
} from '@repo/lib/queryClient';

import { toast } from '@repo/ui';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
} from '@/common/constants';
import {
  hasTradeLeverage,
  isTradeOpenActionType,
} from '@/common/utils/tradeEventType';
import { throttle } from '@/lib/runtime/timing';
import { getCollateralPriceTokenAddress } from '@/lib/trade/collateralPriceToken';
import { getPositionModeKey } from '@/lib/trade/position';
import { resolveTradeIsCreditMarket } from '@/lib/trade/tradeCreditFields';
import {
  getSettledLossRebateUsd,
  getTradeEntryPrice,
  getTradeExitPrice,
  getTradeIndexedMidPrice,
  scaleTradePrice,
  scaleTradeUsd,
} from '@/lib/trade/tradeHistoryPrice';
import { usePriceStore } from '../../stores';
import { useInstStore } from '../../stores/instStore';
import { fetchStatsUserTradeHistory } from './stats';
import type { UserTradeActivityItem } from './statsTypes';
import type { Position as BasePosition } from '@hertzflow/sdk-v2/types/positions';

// Store that broadcasts the latest increasedAtTime/decreasedAtTime per market+direction+mode.
interface PositionTimestampStore {
  lastIncreasedAtTime: Record<string, bigint>;
  lastDecreasedAtTime: Record<string, bigint>;
  setLastIncreasedAtTime: (key: string, value: bigint) => void;
  setLastDecreasedAtTime: (key: string, value: bigint) => void;
}

export const usePositionTimestampStore = create<PositionTimestampStore>(
  (set) => ({
    lastIncreasedAtTime: {},
    lastDecreasedAtTime: {},
    setLastIncreasedAtTime: (key, value) =>
      set((state) => ({
        lastIncreasedAtTime: { ...state.lastIncreasedAtTime, [key]: value },
      })),
    setLastDecreasedAtTime: (key, value) =>
      set((state) => ({
        lastDecreasedAtTime: { ...state.lastDecreasedAtTime, [key]: value },
      })),
  }),
);

export const PAGE_SIZE = 10;

function getCollateralTokenPx({
  collateralToken,
  collateralTokenPriceMin,
  collateralTokenPriceMax,
  pricesMap,
  collateralTokenAddress,
  chainId,
  isCreditMarket,
  usdtTokenAddress,
}: {
  collateralToken?: { decimals: number };
  collateralTokenPriceMin?: string;
  collateralTokenPriceMax?: string;
  pricesMap: Record<
    string,
    { minPrice?: bigint; maxPrice?: bigint } | undefined
  >;
  collateralTokenAddress?: string;
  chainId?: number;
  isCreditMarket?: boolean;
  usdtTokenAddress?: string;
}) {
  if (!collateralToken) return '';

  if (collateralTokenPriceMin && collateralTokenPriceMax) {
    return calc(collateralTokenPriceMax)
      .plus(collateralTokenPriceMin)
      .div(2)
      .times(calc(10).pow(collateralToken.decimals))
      .div(CONTRACT_PRECISION_MULTIPLIER)
      .toFixed();
  }

  if (!collateralTokenAddress) return '';

  const priceTokenAddress = getCollateralPriceTokenAddress({
    chainId,
    collateralTokenAddress,
    isCreditMarket,
    usdtTokenAddress,
  });
  const tokenPrices = pricesMap[priceTokenAddress || collateralTokenAddress];
  const minPrice = tokenPrices?.minPrice ?? tokenPrices?.maxPrice;
  const maxPrice = tokenPrices?.maxPrice ?? tokenPrices?.minPrice;
  if (!minPrice || !maxPrice) return '';

  return calc(minPrice.toString())
    .plus(maxPrice.toString())
    .div(2)
    .div(CONTRACT_USD_MULTIPLIER)
    .toFixed();
}

export type Position = BasePosition & {
  id: string;
  sizeInUsd: string;
  entryPrice: string;
  collateralAmount: string;
  pendingBorrowingFeesUsd: string;
  pendingImpactAmount: string;
  fundingFeeAmount: string;
  isZFP: boolean;
  pendingLossRebateUsd: string;
  isCreditMarket?: boolean;
};

export const usePositionConstants = () => {
  const hzSdk = useHzSdk();

  const result = useQuery({
    queryKey: ['rest', 'positionConstants', hzSdk?.chainId],
    enabled: !!hzSdk,
    queryFn: async () => {
      try {
        return await hzSdk!.positions.getPositionsConstants();
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-positionConstants' });
        throw error;
      }
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: 2_000,
  });

  return result;
};

// get positions
export const usePositions = () => {
  const hzSdk = useHzSdk();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const coinsArr = useInstStore((state) => state.getCoinsArr());
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const accountAddress = useCurrentAccountAddress();
  const result = useQuery({
    queryKey: ['rest', 'positions', hzSdk?.chainId, accountAddress],
    enabled:
      !!hzSdk &&
      !!accountAddress &&
      !!Object.keys(insts).length &&
      !!coinsArr.length &&
      !!Object.keys(pricesMap).length,
    queryFn: async () => {
      try {
        const data = await hzSdk!.positions.getPositions({
          prices: { ...pricesMap },
          tokensData: Object.fromEntries(
            coinsArr.map((v) => [v.address, { decimals: v.decimals }]),
          ),
          marketsData: insts,
        });

        const result = Object.values(data.positionsData || {})
          .filter((v) => insts[v.marketAddress]?.isView)
          .map((v) => {
            const sizeInUsdStr = v.sizeInUsd.toString();
            const market = insts[v.marketAddress];
            const indexToken = market
              ? coins[market.indexTokenAddress]
              : undefined;
            const collateralToken = coins[v.collateralTokenAddress];
            return {
              ...v,
              id: v.key,
              isZFP: v.isZFP,
              sizeInUsd: calc(sizeInUsdStr)
                .div(CONTRACT_USD_MULTIPLIER)
                .toFixed(),
              entryPrice: indexToken
                ? calc(sizeInUsdStr)
                    .div(CONTRACT_USD_MULTIPLIER)
                    .times(calc(10).pow(indexToken.decimals))
                    .div(v.sizeInTokens.toString())
                    .toFixed()
                : '',
              collateralAmount: collateralToken
                ? calc(v.collateralAmount.toString())
                    .div(calc(10).pow(collateralToken.decimals))
                    .toFixed()
                : '',
              pendingBorrowingFeesUsd: calc(
                v.pendingBorrowingFeesUsd.toString(),
              )
                .div(CONTRACT_USD_MULTIPLIER)
                .toFixed(),
              pendingImpactAmount: indexToken
                ? calc(v.pendingImpactAmount.toString())
                    .div(calc(10).pow(indexToken.decimals))
                    .toFixed()
                : '',
              fundingFeeAmount: collateralToken
                ? calc(v.fundingFeeAmount.toString())
                    .div(calc(10).pow(collateralToken.decimals))
                    .toFixed()
                : '',
              pendingLossRebateUsd: calc(v.pendingLossRebateUsd.toString())
                .div(CONTRACT_USD_MULTIPLIER)
                .toFixed(),
              isCreditMarket: market?.category === CREDIT_MARKET_CATEGORY,
            };
          }) as Position[];

        const sorted = result.sort((a, b) => {
          const aTime =
            a.increasedAtTime > a.decreasedAtTime
              ? a.increasedAtTime
              : a.decreasedAtTime;
          const bTime =
            b.increasedAtTime > b.decreasedAtTime
              ? b.increasedAtTime
              : b.decreasedAtTime;
          return bTime - aTime > 0 ? 1 : -1;
        });

        // Broadcast the latest increasedAtTime and decreasedAtTime per
        // market+direction+mode so callers can subscribe instead of polling.
        const { setLastIncreasedAtTime, setLastDecreasedAtTime } =
          usePositionTimestampStore.getState();
        sorted.forEach((p) => {
          const key = getPositionModeKey({
            marketAddress: p.marketAddress,
            isLong: p.isLong,
            isZFP: p.isZFP,
          });
          const { lastIncreasedAtTime, lastDecreasedAtTime } =
            usePositionTimestampStore.getState();
          if (p.increasedAtTime > (lastIncreasedAtTime[key] ?? 0n)) {
            setLastIncreasedAtTime(key, p.increasedAtTime);
          }
          if (p.decreasedAtTime > (lastDecreasedAtTime[key] ?? 0n)) {
            setLastDecreasedAtTime(key, p.decreasedAtTime);
          }
        });

        return sorted;
      } catch (error) {
        if ((error as Error).message !== 'multicall timeout') {
          toast.error((error as Error).message, { id: 'rest-positions' });
        }
        throw error;
      }
    },
    refetchOnMount: false,
    refetchInterval: 10000,
    staleTime: 10000,
  });

  return result;
};

// Throttle interval (ms): ensure at most one refetch per 2 seconds
const THROTTLE_INTERVAL = 2000;

// Throttled refetch positions function
const throttledRefetchPositions = throttle(
  (address: string, chainId: string | number) => {
    return queryClient.refetchQueries({
      queryKey: ['rest', 'positions', chainId, address],
      type: 'active',
    });
  },
  THROTTLE_INTERVAL,
);

// refetch positions with throttle
export const refetchPositions = (
  address: string,
  chainId: string | number,
): Promise<void> => {
  return throttledRefetchPositions(address, chainId) || Promise.resolve();
};

// get positions from cache
export const getPositionByInstFromCache = ({
  address,
  chainId,
  marketAddress,
  isLong,
  isZFP,
}: {
  address?: string;
  chainId?: string | number;
  marketAddress?: string;
  isLong?: boolean;
  isZFP?: boolean;
}) => {
  const data = queryClient.getQueryData<Position[]>([
    'rest',
    'positions',
    chainId,
    address,
    Object.keys(usePriceStore.getState().pricesMap).sort(),
  ]);

  return (
    data?.filter(
      (v) =>
        (!marketAddress || v.marketAddress === marketAddress) &&
        (isLong === undefined || v.isLong === isLong) &&
        (isZFP === undefined || v.isZFP === isZFP),
    ) || []
  );
};

// HZFL-359: HistoryRecord based on unified UserTradeActivityItem
export type HistoryRecord = Omit<
  UserTradeActivityItem,
  'entry_price' | 'exit_price' | 'trigger_price'
> & {
  // Override nullable fields to string (processed in useHistoryRecords)
  entry_price: string;
  exit_price: string;
  trigger_price: string;
  // Computed fields for backward compatibility
  instId: string;
  market_address: string;
  is_long: boolean;
  isOpen: boolean;
  order_type: string;
  display_order_type: string;
  execution_price: string;
  hasPnl: boolean;
  // PnL fields (from pnl_detail when available)
  totalFeeUsd: string;
  uncapped_base_pnl_usd: string;
  price_impact_usd: string;
  liquidation_fee: string;
  open_close_fee_usd: string;
  original_open_close_fee_usd: string;
  funding_fee_usd: string;
  borrowing_fee_usd: string;
  profit_sharing_usd: string;
  loss_rebate_usd: string;
  initialCollateralAmount: string;
  collateralTokenPx: string;
  collateral_token_address: string;
  size_in_usd: string;
  liquidation_price: string;
  position_fee_amount?: string;
  referral_trader_discount_amount?: string;
  referral_trader_discount_factor?: string;
  isCreditMarket?: boolean;
};

// Action types that represent closing / decreasing positions (negative size/collateral)
const DECREASE_ACTION_TYPES = new Set([
  'market_close',
  'market_decrease',
  'tp_close',
  'tp_decrease',
  'sl_close',
  'sl_decrease',
  'liquidated',
  'withdrawal',
]);

// Map trade_type to display label
function getDisplayOrderType(tradeType: string): string {
  switch (tradeType) {
    case 'market':
      return 'Market';
    case 'limit':
      return 'Limit';
    case 'take_profit':
      return 'TP';
    case 'stop_loss':
      return 'SL';
    case 'liquidated':
      return 'Liquidated';
    default:
      return tradeType;
  }
}

// get position history records
export const useHistoryRecords = ({
  instId,
  marketAddress,
  positionType,
  action,
}: {
  instId?: string;
  marketAddress?: string;
  positionType?: string;
  action?: string;
}) => {
  const userAddress = useCurrentAccountAddress();
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const queryKey = useMemo(
    () => [
      'rest',
      'historyRecords',
      userAddress,
      instId,
      marketAddress,
      positionType,
      action,
      hzSdk?.chainId,
    ],
    [action, hzSdk?.chainId, instId, marketAddress, positionType, userAddress],
  );

  const result = useInfiniteQuery({
    queryKey,
    enabled: !!userAddress && !!hzSdk,
    queryFn: async ({ pageParam }) => {
      try {
        const data = await fetchStatsUserTradeHistory({
          market_address: marketAddress as Address | undefined,
          user_address: userAddress as Address,
          trade_types:
            positionType && positionType !== 'all' ? positionType : undefined,
          action_types: action && action !== 'all' ? action : undefined,
          limit: PAGE_SIZE,
          cursor: pageParam,
        });

        const items: HistoryRecord[] = (data.items || []).map((v) => {
          const feeSource = v as UserTradeActivityItem & {
            position_fee_amount?: string;
            referral_trader_discount_amount?: string;
            referral_trader_discount_factor?: string;
            borrowing_fee?: string;
            borrowing_fee_usd?: string;
            funding_fee?: string;
            funding_fee_usd?: string;
            funding_fee_amount?: string;
          };
          const inst = insts[v.market];
          const indexToken = inst ? coins[inst.indexTokenAddress] : undefined;
          const collateralToken = coins[v.collateral_token];
          const isCreditMarket = resolveTradeIsCreditMarket(v);
          const indexDecimals = indexToken?.decimals;

          const isOpen = isTradeOpenActionType(v.action_type);
          const isDecrease = DECREASE_ACTION_TYPES.has(v.action_type);
          const hasPnl = isDecrease && v.action_type !== 'withdrawal';
          const pnl = hasPnl ? v.pnl_detail : undefined;
          const pnlDetail = pnl as
            | (NonNullable<UserTradeActivityItem['pnl_detail']> & {
                close_fee?: string;
                position_fee?: string;
                funding_fee?: string;
                borrowing_fee?: string;
              })
            | undefined;
          const sign = isDecrease ? -1 : 1;

          // Collateral token price (avg of min/max)
          const collateralTokenPx = getCollateralTokenPx({
            collateralToken,
            collateralTokenPriceMin: v.collateral_token_price_min,
            collateralTokenPriceMax: v.collateral_token_price_max,
            pricesMap,
            collateralTokenAddress: v.collateral_token,
            chainId: hzSdk?.chainId,
            isCreditMarket,
            usdtTokenAddress: coins.USDT?.address,
          });

          // Collateral delta in human-readable token units
          const collateralDeltaAmount = collateralToken
            ? calc(v.collateral_delta_amount || '0')
                .div(calc(10).pow(collateralToken.decimals))
                .toFixed()
            : '';

          const entryPrice = getTradeEntryPrice({
            isOpen,
            indexTokenDecimals: indexDecimals,
            sizeDeltaUsd: v.size_delta_usd,
            sizeDeltaTokens: v.size_delta_tokens,
            sizeInUsd: v.size_in_usd,
            sizeInTokens: v.size_in_tokens,
          });
          const exitPrice = getTradeExitPrice({
            isLong: v.is_long,
            indexTokenPriceMin: v.index_token_price_min,
            indexTokenPriceMax: v.index_token_price_max,
            executionPrice: v.execution_price,
            indexTokenDecimals: indexDecimals,
          });
          const midPrice = getTradeIndexedMidPrice({
            indexTokenPriceMin: v.index_token_price_min,
            indexTokenPriceMax: v.index_token_price_max,
            indexTokenDecimals: indexDecimals,
          });
          const directIndexTokenPrice = scaleTradePrice(
            (v as UserTradeActivityItem & { index_token_price?: string })
              .index_token_price ?? null,
            indexDecimals,
          );
          const triggerPrice = scaleTradePrice(
            v.trigger_price ?? null,
            indexDecimals,
          );
          const resolvedEntryPrice = isOpen
            ? entryPrice || midPrice || directIndexTokenPrice || triggerPrice
            : entryPrice;
          const executionPrice = isOpen
            ? entryPrice || midPrice || directIndexTokenPrice || triggerPrice
            : exitPrice || midPrice || directIndexTokenPrice || triggerPrice;
          const grossPnlUsd = calc(scaleTradeUsd(pnl?.gross_pnl) || 0);
          const settledProfitSharingUsd =
            pnl && v.is_zfp && grossPnlUsd.gt(0)
              ? calc(scaleTradeUsd(pnl.profit_sharing) || 0)
              : calc(0);
          const settledLossRebateUsd = calc(getSettledLossRebateUsd(pnl));

          return {
            ...v,
            // Backward-compatible fields
            instId: v.market,
            market_address: v.market,
            isOpen,
            order_type: v.trade_type,
            display_order_type: getDisplayOrderType(v.trade_type),
            execution_price: executionPrice,
            hasPnl,
            // Scale USD values from contract precision, apply sign for close/decrease
            size_delta_usd: calc(scaleTradeUsd(v.size_delta_usd) || 0)
              .times(sign)
              .toFixed(),
            collateral_delta_amount: collateralDeltaAmount
              ? calc(collateralDeltaAmount).times(sign).toFixed()
              : '',
            collateral_token_address: v.collateral_token,
            collateralTokenPx,
            // Scale prices
            entry_price: resolvedEntryPrice,
            exit_price: exitPrice,
            trigger_price: triggerPrice,
            liquidation_price: v.trade_type === 'liquidated' ? exitPrice : '',
            position_fee_amount:
              collateralToken && collateralTokenPx
                ? calc(feeSource.position_fee_amount || '0')
                    .div(calc(10).pow(collateralToken.decimals))
                    .times(collateralTokenPx)
                    .toFixed()
                : '0',
            referral_trader_discount_amount:
              collateralToken && collateralTokenPx
                ? calc(feeSource.referral_trader_discount_amount || '0')
                    .div(calc(10).pow(collateralToken.decimals))
                    .times(collateralTokenPx)
                    .toFixed()
                : '0',
            referral_trader_discount_factor:
              feeSource.referral_trader_discount_factor || '0',
            isCreditMarket,
            // Leverage: only show for open/close/liquidated actions
            // leverage = size_delta_usd / (collateral_delta_amount * collateral_token_price)
            leverage: (() => {
              const showLeverage = hasTradeLeverage(v.action_type);
              if (!showLeverage) return '';
              if (
                !collateralTokenPx ||
                !collateralDeltaAmount ||
                collateralDeltaAmount === '0'
              )
                return '';
              const collateralUsd = calc(collateralDeltaAmount).times(
                collateralTokenPx,
              );
              if (!collateralUsd.abs().gt(0)) return '';
              return calc(v.size_delta_usd)
                .abs()
                .div(CONTRACT_USD_MULTIPLIER)
                .div(collateralUsd.abs())
                .toFixed(1);
            })(),
            uncapped_base_pnl_usd: grossPnlUsd.toFixed(),
            totalFeeUsd: scaleTradeUsd(pnl?.fees) || '0',
            price_impact_usd: scaleTradeUsd(pnl?.price_impact) || '0',
            liquidation_fee: scaleTradeUsd(pnl?.liquidation_fee) || '0',
            original_open_close_fee_usd:
              collateralToken && collateralTokenPx
                ? calc(feeSource.position_fee_amount || '0')
                    .div(calc(10).pow(collateralToken.decimals))
                    .times(collateralTokenPx)
                    .toFixed()
                : '0',
            open_close_fee_usd: (() => {
              const rawFee =
                pnlDetail?.close_fee ?? pnlDetail?.position_fee ?? undefined;
              if (rawFee !== undefined) {
                return scaleTradeUsd(rawFee) || '0';
              }

              if (!collateralToken || !collateralTokenPx) return '0';
              return calc(feeSource.position_fee_amount || '0')
                .minus(feeSource.referral_trader_discount_amount || '0')
                .div(calc(10).pow(collateralToken.decimals))
                .times(collateralTokenPx)
                .toFixed();
            })(),
            funding_fee_usd:
              scaleTradeUsd(
                pnlDetail?.funding_fee ??
                  feeSource.funding_fee_usd ??
                  feeSource.funding_fee,
              ) ||
              (collateralToken && collateralTokenPx
                ? calc(feeSource.funding_fee_amount || '0')
                    .div(calc(10).pow(collateralToken.decimals))
                    .times(collateralTokenPx)
                    .toFixed()
                : '0'),
            borrowing_fee_usd:
              scaleTradeUsd(
                pnlDetail?.borrowing_fee ??
                  feeSource.borrowing_fee_usd ??
                  feeSource.borrowing_fee,
              ) || '0',
            profit_sharing_usd: settledProfitSharingUsd.toFixed(),
            loss_rebate_usd: settledLossRebateUsd.toFixed(),
            initialCollateralAmount:
              collateralToken && pnl?.initial_collateral_amount
                ? calc(pnl.initial_collateral_amount)
                    .div(calc(10).pow(collateralToken.decimals))
                    .toFixed()
                : '',
            size_in_usd: scaleTradeUsd(v.size_in_usd),
          };
        });

        return {
          items,
          next_cursor: data.next_cursor || '',
        };
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-historyRecords' });
        throw error;
      }
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => {
      return lastPage.next_cursor || undefined;
    },
  });
  const refetch = result.refetch;

  const refetchFirstPage = useCallback(() => {
    queryClient.setQueryData<
      InfiniteData<{ items: HistoryRecord[]; next_cursor: string }>
    >(queryKey, (data) => {
      if (!data || data.pages.length <= 1) return data;
      return {
        pages: data.pages.slice(0, 1),
        pageParams: data.pageParams.slice(0, 1),
      };
    });
    return refetch();
  }, [queryKey, refetch]);

  return { query: result, refetchFirstPage };
};
