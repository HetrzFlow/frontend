import { calc } from '@repo/lib/calc';
import { useQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import type { BaseResInterface } from '@/common/services';
import { toChecksumAddress } from '@/lib/address';
import { IMAGES_MAP } from '../../assets';
import { DATA_STAT_API_BASE_URL } from './const';

export type BaseTradeRecord = {
  action_id: string;
  symbol: string;
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
  has_profit: boolean | null;
  fee_usd: string;
  action_time_ms: number;
  block_timestamp: number;

  userAvatar?: string;
  sizeUsd: string;
};

// Each hook has its own type extending BaseTradeRecord.
// When the API adds type-specific fields, extend here without affecting the other.
export type SmartMoneyTradeType = BaseTradeRecord;
export type WhaleTradeType = BaseTradeRecord;

interface CreateTradeHookConfig<T extends BaseTradeRecord> {
  type: string;
  queryKeyPrefix: string;
  avatarOffset: number;
  initialData?: T[];
  transform?: (item: BaseTradeRecord, index: number) => T;
}

function createTradeHook<T extends BaseTradeRecord>(
  config: CreateTradeHookConfig<T>,
) {
  const defaultTransform = (item: BaseTradeRecord) => item as T;
  const transform = config.transform ?? defaultTransform;

  return ({
    instId,
    limit,
  }: {
    instId?: string;
    limit?: number;
  } = {}) => {
    return useQuery({
      queryKey: ['rest', config.queryKeyPrefix, instId, limit],
      initialData: config.initialData,
      queryFn: async () => {
        const { error, data } = await get<
          BaseResInterface<{ items: BaseTradeRecord[] }>
        >(`${DATA_STAT_API_BASE_URL}/v3/bnb/trades/${config.type}`, {
          symbol: instId,
          limit,
        });

        if (error) {
          toast.error(error, { id: `rest-${config.queryKeyPrefix}` });
          throw new Error(error);
        }

        return (data?.items || []).map((v, i) => {
          v.user_address = toChecksumAddress(v.user_address);
          v.contract_address = toChecksumAddress(v.contract_address);
          v.userAvatar =
            IMAGES_MAP.avatars[
              (i + config.avatarOffset) % IMAGES_MAP.avatars.length
            ]!;
          v.sizeUsd = calc(v.price).times(v.size_delta).toFixed();
          return transform(v, i);
        });
      },
    });
  };
}

export const useSmartMoneyTrades = createTradeHook<SmartMoneyTradeType>({
  type: 'smart-money',
  queryKeyPrefix: 'smartMoneyTrades',
  avatarOffset: 5,
});

export const useWhaleTrades = createTradeHook<WhaleTradeType>({
  type: 'whale',
  queryKeyPrefix: 'whaleTrades',
  avatarOffset: 0,
  initialData: [],
});
