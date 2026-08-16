import { calc } from '@repo/lib/calc';
import { queryClient, useQuery } from '@repo/lib/queryClient';

import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  useHzSdk,
  useInstStore,
} from '@/common';
import type { BaseResInterface, Order } from '@/common/services';
import { DATA_STAT_API_BASE_URL } from '@/common/services/rest/const';
import { fetchStatsTradeHistory } from '@/common/services/rest/stats';
import type { PlatformTradeItem } from '@/common/services/rest/statsTypes';
import { usePriceStore } from '@/common/stores';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';
import { getCollateralPriceTokenAddress } from '@/lib/trade/collateralPriceToken';
import { resolveTradeIsCreditMarket } from '@/lib/trade/tradeCreditFields';
import {
  getSettledLossRebateUsd,
  getTradeEntryPrice,
  getTradeExitPrice,
  scaleTradeUsd,
} from '@/lib/trade/tradeHistoryPrice';

// get related orders by position
export const usePositionOrders = (positionId?: string) => {
  return useQuery({
    queryKey: ['rest', 'positionOrders', positionId],
    initialData: [],
    enabled: !!positionId,
    queryFn: () => {
      // return get(`${API_BASE_URL}/xxx`)
      return Promise.resolve([
        // {
        //   id: '1',
        //   instId: 'BTC/USD',
        //   triggerPrice: '90000',
        //   size: '500',
        //   posSide: 'long',
        //   side: 'sell',
        //   lever: '20',
        //   orderTime: 1749549470305,
        //   triggerType: ORDER_TRIGGER_TYPE.down,
        // },
      ] as Order[]);
    },
  });
};

export type HistoryOrder = {
  action_id: string;
  tx_hash: string;
  log_index: number;
  block_number: number;
  user_address: string;
  contract_address: string;
  position_id: string;
  action_type: string;
  index_coin: string;
  collateral_coin: string;
  is_long: true;
  size_delta: string;
  collateral_delta: string;
  price: string;
  realized_pnl: string;
  has_profit?: boolean | null;
  fee_usd: string;
  action_time_ms: number;
  block_timestamp: number;
};

// get history orders
export const useHistoryOrders = ({
  userAddress,
  instId,
  limit,
}: {
  userAddress?: string;
  instId?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['rest', 'historyOrders', userAddress, instId, limit],
    initialData: [],
    enabled: !!userAddress,
    queryFn: async () => {
      const { error, data } = await get<
        BaseResInterface<{ items?: HistoryOrder[] }>
      >(`${DATA_STAT_API_BASE_URL}/v3/bnb/user/trades`, {
        user_address: toLowerAddressParam(userAddress),
        symbol: instId,
        limit,
      });

      if (error) {
        toast.error(error, { id: 'rest-historyOrders' });
        throw new Error(error);
      }

      return (data?.items || []).map((item) => ({
        ...item,
        user_address: toChecksumAddress(item.user_address),
        contract_address: toChecksumAddress(item.contract_address),
      }));
    },
  });
};

const OPEN_ACTION_TYPES = new Set([
  'market_open',
  'market_increase',
  'limit_open',
  'limit_increase',
  'deposit',
]);

const DECREASE_ACTION_TYPES = new Set([
  'market_close',
  'market_decrease',
  'limit_close',
  'limit_decrease',
  'tp_close',
  'sl_close',
  'liquidated',
  'withdrawal',
]);

const LEVERAGE_ACTION_TYPES = new Set([
  'market_open',
  'market_close',
  'limit_open',
  'tp_close',
  'sl_close',
  'liquidated',
]);

export type PlatformHistoryOrder = {
  // Core identity
  market: string;
  market_symbol: string;
  is_long: boolean;
  is_zfp: boolean;
  action_type: string;
  trade_type: string;
  display_action: string;
  tx_hash: string;
  log_index: number;
  action_time_ms: number;
  user_address: string;
  order_key: string;
  position_key?: string;
  // Scaled values
  execution_price: string;
  size_delta_usd: string;
  size_in_usd: string;
  collateral_delta_amount: string;
  collateralTokenPrice: string;
  collateral_token: string;
  // PnL (from pnl_detail, scaled)
  uncapped_base_pnl_usd: string;
  loss_rebate_usd: string;
  profit_sharing_usd: string;
  totalFeeUsd: string;
  price_impact_usd: string;
  liquidation_fee: string;
  initialCollateralAmount: string;
  collateral_amount: string;
  // Computed
  isOpen: boolean;
  leverage: string;
  isCreditMarket?: boolean;
};

export type PlatformHistoryTrade = PlatformTradeItem & {
  action_time_ms?: number;
};

export type PlatformHistoryOrderMappingContext = {
  coins: Record<string, { decimals: number } | undefined>;
  pricesMap: Record<
    string,
    { minPrice?: bigint; maxPrice?: bigint } | undefined
  >;
  chainId?: number;
  indexTokenDecimals?: number;
  usdtTokenAddress?: string;
};

const INTERVAL = 5_000;

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
  pricesMap: PlatformHistoryOrderMappingContext['pricesMap'];
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

export function mapPlatformHistoryOrder(
  trade: PlatformHistoryTrade,
  {
    coins,
    pricesMap,
    chainId,
    indexTokenDecimals,
    usdtTokenAddress,
  }: PlatformHistoryOrderMappingContext,
): PlatformHistoryOrder {
  const market = toChecksumAddress(trade.market);
  const userAddress = toChecksumAddress(trade.user_address);
  const collateralTokenAddress = toChecksumAddress(trade.collateral_token);
  const collateralToken = coins[collateralTokenAddress];
  const action = trade.action;
  const isCreditMarket = resolveTradeIsCreditMarket(trade);
  const isOpen = OPEN_ACTION_TYPES.has(action);
  const isDecrease = DECREASE_ACTION_TYPES.has(action);
  const hasPnl = isDecrease && action !== 'withdrawal';
  const pnl = hasPnl ? trade.pnl_detail : undefined;
  const grossPnlUsd = calc(scaleTradeUsd(pnl?.gross_pnl) || 0);
  const settledLossRebateUsd = calc(getSettledLossRebateUsd(pnl));
  const profitSharingUsd =
    pnl && trade.is_zfp && grossPnlUsd.gt(0)
      ? calc(scaleTradeUsd(pnl.profit_sharing) || 0)
      : calc(0);

  const collateralTokenPrice = getCollateralTokenPx({
    collateralToken,
    collateralTokenPriceMin: trade.collateral_token_price_min,
    collateralTokenPriceMax: trade.collateral_token_price_max,
    pricesMap,
    collateralTokenAddress,
    chainId,
    isCreditMarket,
    usdtTokenAddress,
  });

  const collateralDeltaAmount = collateralToken
    ? calc(trade.collateral_delta_amount || '0')
        .div(calc(10).pow(collateralToken.decimals))
        .toFixed()
    : '';

  const entryPrice = getTradeEntryPrice({
    isOpen,
    indexTokenDecimals,
    sizeDeltaUsd: trade.size_delta_usd,
    sizeDeltaTokens: trade.size_delta_tokens,
    sizeInUsd: trade.size_in_usd,
    sizeInTokens: trade.size_in_tokens,
  });
  const exitPrice = getTradeExitPrice({
    isLong: trade.is_long,
    indexTokenPriceMin: trade.index_token_price_min,
    indexTokenPriceMax: trade.index_token_price_max,
    executionPrice: trade.execution_price || '',
    indexTokenDecimals,
  });
  const executionPrice = isOpen ? entryPrice : exitPrice;

  const leverage = (() => {
    if (!LEVERAGE_ACTION_TYPES.has(action)) return '';
    if (
      !collateralTokenPrice ||
      !collateralDeltaAmount ||
      collateralDeltaAmount === '0'
    )
      return '';
    const collateralUsd = calc(collateralDeltaAmount).times(
      collateralTokenPrice,
    );
    if (!collateralUsd.abs().gt(0)) return '';
    return calc(trade.size_delta_usd)
      .abs()
      .div(CONTRACT_USD_MULTIPLIER)
      .div(collateralUsd.abs())
      .toFixed(1);
  })();

  const initialCollateralAmount =
    collateralToken && pnl?.initial_collateral_amount
      ? calc(pnl.initial_collateral_amount)
          .div(calc(10).pow(collateralToken.decimals))
          .toFixed()
      : '';

  return {
    market,
    market_symbol: trade.market_symbol,
    is_long: trade.is_long,
    is_zfp: trade.is_zfp ?? false,
    action_type: action,
    trade_type: trade.trade_type,
    display_action: trade.display_action,
    tx_hash: trade.tx_hash,
    log_index: trade.log_index,
    action_time_ms: trade.timestamp ?? trade.action_time_ms ?? 0,
    user_address: userAddress,
    order_key: trade.order_key,
    position_key: trade.position_key,
    execution_price: executionPrice,
    size_delta_usd: scaleTradeUsd(trade.size_delta_usd),
    size_in_usd: scaleTradeUsd(trade.size_in_usd),
    collateral_delta_amount: collateralDeltaAmount,
    collateralTokenPrice: collateralTokenPrice,
    collateral_token: collateralTokenAddress,
    uncapped_base_pnl_usd: grossPnlUsd.toFixed(),
    loss_rebate_usd: settledLossRebateUsd.toFixed(),
    profit_sharing_usd: profitSharingUsd.toFixed(),
    totalFeeUsd: scaleTradeUsd(pnl?.fees) || '0',
    price_impact_usd: scaleTradeUsd(pnl?.price_impact) || '0',
    liquidation_fee: scaleTradeUsd(pnl?.liquidation_fee) || '0',
    initialCollateralAmount,
    collateral_amount: initialCollateralAmount || collateralDeltaAmount,
    isOpen,
    leverage,
    isCreditMarket,
  };
}

// get platform history orders
export const usePlatformHistoryOrders = ({
  instId,
  enabled = true,
  refetchInterval = INTERVAL,
}: {
  instId?: string;
  enabled?: boolean;
  refetchInterval?: number | false;
} = {}) => {
  const hzSdk = useHzSdk();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const inst = insts[instId || ''];

  return useQuery({
    queryKey: ['rest', 'platformHistoryOrders', instId],
    enabled: enabled && !!hzSdk && !!inst?.marketTokenAddress,
    queryFn: async () => {
      try {
        const data = await fetchStatsTradeHistory({
          market_address: inst!.marketTokenAddress,
        });

        const indexToken = coins[inst?.indexTokenAddress || ''];
        const indexTokenDecimals = indexToken?.decimals;

        return data.map(
          (trade): PlatformHistoryOrder =>
            mapPlatformHistoryOrder(trade, {
              coins,
              pricesMap,
              chainId: hzSdk?.chainId,
              indexTokenDecimals,
              usdtTokenAddress: coins.USDT?.address,
            }),
        );
      } catch (error) {
        toast.error((error as Error).message, {
          id: 'rest-platformHistoryOrders',
        });
        throw error;
      }
    },
    refetchInterval,
    staleTime: typeof refetchInterval === 'number' ? refetchInterval : INTERVAL,
  });
};

// refetch positions
export const refetchPlatformHistoryOrders = (instId?: string) => {
  queryClient.refetchQueries({
    queryKey: ['rest', 'platformHistoryOrders', instId],
    type: 'active',
  });
};
