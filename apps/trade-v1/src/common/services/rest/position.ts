import {
  CompletePositionInfo,
  PositionEventType,
  PositionHistoryResponse,
  PositionType,
  PRICE_AMPLIFICATION_MULTIPLIER,
  PRICE_MULTIPLIER_DECIMAL,
  SortType,
  SuiTypeIdentifier,
} from '@hertzflow/sdk';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { normalizeStructTag } from '@mysten/sui/utils';
import { calc } from '@repo/lib/calc';
import { queryClient, useInfiniteQuery, useQuery } from '@repo/lib/queryClient';

import { toast } from '@repo/ui';
import { useHzSdk } from '../../chainClient/hooks';
import { useInstStore } from '../../stores/instStore';

export const PAGE_SIZE = 10;

export type Position = CompletePositionInfo & {
  targetCoin: string;
  id: string;
  entryPrice: string;
  isLong: boolean;
  size: string;
  collateral: string;
  collateralCoin: string;
  lastUpdateTime: number;
  entryFundingRate: string;
};

// get positions
export const usePositions = (refetchInterval?: number) => {
  const currentAccount = useCurrentAccount();
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());
  const result = useQuery({
    queryKey: [
      'rest',
      'positions',
      currentAccount?.address,
      hzSdk.fullClient.network,
    ],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      try {
        const data = await hzSdk.PositionModule.getUserCompletePositions(
          currentAccount!.address!,
        );

        return data.map((v) => {
          const position = v as Position;
          position.targetCoin = v.metadata.indexToken
            ? normalizeStructTag(v.metadata.indexToken)
            : '';
          position.collateralCoin = v.metadata.collateralToken
            ? normalizeStructTag(v.metadata.collateralToken)
            : '';
          position.id = v.metadata.positionId;
          position.isLong = v.metadata.isLong;

          position.lastUpdateTime = +v.metadata.lastIncreaseTime * 1000;
          position.entryFundingRate = v.metadata.entryFundingRate;

          const coin = coins[position.targetCoin];
          position.size = calc(v.metadata.size)
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .toFixed();
          position.entryPrice = calc(v.metadata.averagePrice)
            .times(calc(10).pow(coin?.decimal || ''))
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .div(calc(10).pow(PRICE_AMPLIFICATION_MULTIPLIER))
            .toFixed();
          position.collateral = calc(v.metadata.collateral)
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .toFixed();
          position.leverage = calc(position.size)
            .div(position.collateral)
            .toFixed();
          return v;
        }) as Position[];
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-positions' });
        throw error;
      }
    },
    refetchOnMount: 'always',
    refetchInterval: refetchInterval,
  });

  return result;
};

// refetch positions
export const refetchPositions = (address: string, network: string) => {
  queryClient.refetchQueries({
    queryKey: ['rest', 'positions', address, network],
    type: 'active',
  });
};

// get positions from cache
export const getPositionByInstFromCache = ({
  address,
  network,
  indexCoinType,
  isLong,
}: {
  address?: string;
  network: string;
  indexCoinType: string;
  isLong: boolean;
}) => {
  const data = queryClient.getQueryData<Position[]>([
    'rest',
    'positions',
    address,
    network,
  ]);

  return (
    data?.filter(
      (v) => v.targetCoin === indexCoinType && v.isLong === isLong,
    ) || []
  );
};

export type HistoryRecord = {
  tx_digest: string;
  position_key: string;
  position_owner: string;
  event_type: string;
  direction: string;
  position_type: string;
  size_delta: string;
  collateral_delta: string;
  collateral_coin: string;
  index_coin: string;
  fee: string;
  price: string;
  pnl: string;
  // ms
  timestamp: number;
  // extend
  isClose: boolean;
  id: string;
};

// get position history records
export const useHistoryRecords = ({
  indexCoinType,
  positionType,
  action,
  sortBy,
  sort,
}: {
  indexCoinType?: string;
  positionType?: string;
  action?: string;
  sortBy?: string;
  sort?: 'DESC' | 'ASC';
}) => {
  const currentAccount = useCurrentAccount();
  const hzSdk = useHzSdk();
  const coins = useInstStore((state) => state.getCoins());

  const result = useInfiniteQuery({
    queryKey: [
      'rest',
      'historyRecords',
      currentAccount?.address,
      indexCoinType,
      positionType,
      action,
      sortBy,
      sort,
      hzSdk.fullClient.network,
    ],
    enabled: !!currentAccount?.address,
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const data = await hzSdk.ApiModule.fetchPositionHistory({
          user_addr: currentAccount!.address,
          page: pageParam,
          page_size: PAGE_SIZE,
          position_type: positionType as PositionType,
          index_coin: indexCoinType as SuiTypeIdentifier,
          action: action as PositionEventType,
          sort_by: sortBy,
          sort: sort as SortType,
        });
        (data?.items as HistoryRecord[]).forEach((v, i) => {
          v.id = `${v.tx_digest}_${i}`;
          v.index_coin = v.index_coin
            ? normalizeStructTag(v.index_coin)
            : v.index_coin;
          v.collateral_coin = v.collateral_coin
            ? normalizeStructTag(v.collateral_coin)
            : v.collateral_coin;

          const coin = coins[v.index_coin];
          v.price = calc(v.price)
            .times(calc(10).pow(coin?.decimal || ''))
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .div(calc(10).pow(PRICE_AMPLIFICATION_MULTIPLIER))
            .toFixed();
          v.collateral_delta = calc(v.collateral_delta)
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .toFixed();
          v.size_delta = calc(v.size_delta)
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .toFixed();
          v.isClose = [
            'decrease_long',
            'close_long',
            'decrease_short',
            'close_short',
            'liquidated',
          ].includes(v.event_type);
          v.size_delta = v.isClose ? `-${v.size_delta}` : v.size_delta;
          v.fee = calc(v.fee)
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .toFixed();
          v.pnl = calc(v.pnl)
            .div(calc(10).pow(PRICE_MULTIPLIER_DECIMAL))
            .toFixed();
        });
        return data as Omit<PositionHistoryResponse, 'items'> & {
          items: HistoryRecord[];
        };
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-historyRecords' });
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage?.page && lastPage.page * PAGE_SIZE < lastPage.total) {
        return pages.length + 1;
      }
      return undefined;
    },
  });

  return result;
};
