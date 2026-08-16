import { useInfiniteQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';
import type { HistoryItemDetail } from '@/services/rest/pools';

const ACTIVITY_PAGE_SIZE = 10;
const SUCCESS_CODE = 200;

const EMPTY_ACTIVITY_RESPONSE: ActivityResponse = {
  activities: [],
  has_more: false,
};

export type ActivityType =
  | 'trade'
  | 'vault'
  | 'pool'
  | 'claim'
  | 'referral_claim'
  | 'credit_claim'
  | 'hzfl_claim'
  | 'fee_rebate';

export type ActivityPnlDetail = {
  initial_collateral?: string;
  gross_pnl?: string;
  loss_rebate?: string;
  close_fee?: string;
  funding_fee?: string;
  borrowing_fee?: string;
  residual_collateral?: string;
  price_impact?: string;
  liquidation_fee?: string;
  profit_sharing?: string;
  returned_collateral?: string;
  net_pnl?: string;
};

export type ActivitySubEntry = HistoryItemDetail;

export type LiquidityActivityAction =
  | 'deposit'
  | 'withdraw'
  | 'cancelled_deposit'
  | 'cancelled_withdraw';

export type ActivityClaimDetail = {
  claim_type?:
    | 'funding_fees'
    | 'collateral'
    | 'affiliate_reward'
    | 'predeposit_cash';
  market?: string;
  market_symbol?: string;
  token?: string;
  amount?: string;
  amount_usd?: string;
  is_long?: boolean;
};

export type ActivityLossRebateInfo = {
  pending_lr_usd?: string;
  actual_rebate_usd?: string;
};

export type ActivityItem = {
  action_type: ActivityType;
  action: string | LiquidityActivityAction;
  market_address?: string;
  symbol?: string;
  pool_type?: string;
  tx_hash: string;
  timestamp: number;
  block_number: number;

  // Trade fields (action_type=trade)
  is_long?: boolean;
  log_index?: number;
  order_type?: string;
  order_key?: string;
  position_key?: string;
  user_address?: string;
  market?: string;
  market_symbol?: string;
  source_type?: string;
  position_mode?: string;
  is_zfp?: boolean;
  profit_sharing_usd?: string;
  loss_rebate_info?: ActivityLossRebateInfo;
  direction?: string;
  leverage?: string;
  display_order_type?: string;
  display_action?: string;
  entry_price?: string;
  exit_price?: string;
  liquidation_price?: string;
  pnl_detail?: ActivityPnlDetail;
  order_status?: string;
  cancel_reason?: string;
  trigger_price?: string;
  execution_price?: string;
  collateral_token?: string;
  collateral_token_price_min?: string;
  collateral_token_price_max?: string;
  index_token_price?: string;
  index_token_price_min?: string;
  index_token_price_max?: string;
  size_in_usd?: string;
  size_in_tokens?: string;
  size_delta_usd?: string;
  size_delta_tokens?: string;
  collateral_amount?: string;
  collateral_delta_amount?: string;
  price_impact_usd?: string;
  total_impact_usd?: string;
  uncapped_base_pnl_usd?: string;
  proportional_pending_impact?: string;
  position_fee?: string;
  protocol_fee?: string;
  funding_fee?: string;
  borrowing_fee?: string;
  swap_fee?: string;
  liquidation_fee?: string;
  fee_usd_for_pool?: string;
  total_rebate_amount?: string;
  trader_discount_amount?: string;
  affiliate_reward_amount?: string;
  total_fee?: string;
  is_credit_market?: boolean;

  // Liquidity fields (action_type=pool|vault)
  status?: 'pending' | 'success' | 'cancelled';
  executed_tx_hash?: string;
  wallet_address?: string;
  lp_shares?: string;
  delta_usd?: string;
  fees_earned_usd?: string;

  // Claim-specific fields (action_type=claim)
  claim_value_usd?: string;
  claim_count?: number;
  claim_types?: string[];
  market_symbols?: string[];
  claim_details?: ActivityClaimDetail[];

  // Referral claim fields (action_type=referral_claim)
  reward_token_address?: string;
  reward_market_address?: string;
  reward_amount?: string;
  receiver_address?: string;
  remaining_pool?: string;
  source_log_index?: number;

  // Credit claim fields (action_type=credit_claim|hzfl_claim)
  credit_amount?: string;
  hzfl_amount?: string;
  season_id?: number;

  // Fee rebate fields (action_type=fee_rebate)
  rebate_amt_usdt?: string;
  used_credit_amount?: string;

  // Vault aggregated children
  sub_entries?: ActivitySubEntry[];
};

export type ActivityResponse = {
  activities: ActivityItem[];
  has_more: boolean;
  next_cursor?: string;
};

type ActivitiesApiResponse = {
  code?: number;
  error?: string;
  message?: string;
  msg?: string;
  data?: ActivityResponse;
};

export function getActivitiesNextCursor(lastPage: ActivityResponse) {
  if (!lastPage.has_more) return undefined;
  return lastPage.next_cursor || undefined;
}

export const useActivities = ({
  enabled = true,
  isPredeposit = false,
}: {
  enabled?: boolean;
  isPredeposit?: boolean;
} = {}) => {
  const accountAddress = useCurrentAccountAddress();
  const accountAddressParam = toLowerAddressParam(accountAddress);

  return useInfiniteQuery({
    queryKey: ['rest', 'activities', accountAddressParam, { isPredeposit }],
    enabled: enabled && !!accountAddress,
    queryFn: async ({ pageParam }) => {
      const response = await get<ActivitiesApiResponse>(
        `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/user/activities`,
        {
          account: accountAddressParam,
          limit: ACTIVITY_PAGE_SIZE,
          cursor: pageParam || undefined,
          is_predeposit: isPredeposit || undefined,
        },
      );

      const errorMessage =
        response.error ||
        (response.code !== undefined && response.code !== SUCCESS_CODE
          ? response.msg || response.message || 'Failed to fetch activities'
          : undefined);

      if (errorMessage) {
        toast.error(errorMessage, { id: 'rest-activities' });
        throw new Error(errorMessage);
      }

      response.data?.activities.forEach((v) => {
        if (v.market_address) {
          v.market_address = toChecksumAddress(v.market_address);
        }
        if (v.user_address) {
          v.user_address = toChecksumAddress(v.user_address);
        }
        if (v.wallet_address) {
          v.wallet_address = toChecksumAddress(v.wallet_address);
        }
        if (v.market) {
          v.market = toChecksumAddress(v.market);
        }
        if (v.collateral_token) {
          v.collateral_token = toChecksumAddress(v.collateral_token);
        }
        if (v.reward_token_address) {
          v.reward_token_address = toChecksumAddress(v.reward_token_address);
        }
        if (v.reward_market_address) {
          v.reward_market_address = toChecksumAddress(v.reward_market_address);
        }
        if (v.receiver_address) {
          v.receiver_address = toChecksumAddress(v.receiver_address);
        }

        v.claim_details?.forEach((v) => {
          if (v.market) {
            v.market = toChecksumAddress(v.market);
          }
        });
      });

      return response.data ?? EMPTY_ACTIVITY_RESPONSE;
    },
    initialPageParam: '',
    getNextPageParam: getActivitiesNextCursor,
  });
};
