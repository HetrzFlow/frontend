'use client';

import { useQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';

const SUCCESS_CODE = 200;

type ReferralProfileApiResponse = {
  code?: number;
  error?: string;
  msg?: string;
  message?: string;
  data?: ReferralProfile;
};

type ReferralProfileNextTier = {
  tier_id: number;
  min_active_referred_traders: number;
  min_rolling_30d_referred_volume_usd: string;
  remaining_active_referred_traders: number;
  remaining_rolling_30d_referred_volume_usd: string;
};

export type ReferralProfile = {
  user_address: string;
  has_bound_referrer: boolean;
  bound_referral_code: string;
  direct_referrer_address: string;
  indirect_referrer_address: string;
  invite_code_count: number;
  current_onchain_tier: number;
  computed_target_tier: number;
  tier_sync_status: string;
  rule_set_name: string;
  rule_source: string;
  active_referred_trader_count: number;
  total_referred_trader_count: number;
  rolling_30d_referred_volume_usd: string;
  cumulative_affiliate_reward_usd: string;
  rewards_usd: string;
  claimable_reward_usd: string;
  discount_saved_usd: string;
  current_discount_bps: number;
  referrer_current_tier_id: number;
  referrer_current_tier_label: string;
  current_tier_label: string;
  compact_tier_label: string;
  hidden_tier_code?: string;
  is_exclusive?: boolean;
  hidden_tier_lp_position_usd?: string;
  hidden_tier_lp_threshold?: string;
  notice_state: string;
  notice_title: string;
  notice_message: string;
  last_evaluated_at_ms: number;
  last_synced_at_ms: number;
  next_tier: ReferralProfileNextTier | null;
};

export const useReferralProfile = () => {
  const userAddress = useCurrentAccountAddress();
  const userAddressParam = toLowerAddressParam(userAddress);

  return useQuery<ReferralProfile | null>({
    queryKey: ['rest', 'referral-profile', userAddressParam],
    enabled: !!userAddress,
    queryFn: async () => {
      const response = await get<ReferralProfileApiResponse>(
        `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/user/referral-profile`,
        {
          user_address: toLowerAddressParam(userAddress),
        },
      );

      const errorMessage =
        response.error ||
        (response.code !== undefined && response.code !== SUCCESS_CODE
          ? response.msg ||
            response.message ||
            'Failed to fetch referral profile'
          : undefined);

      if (errorMessage) {
        toast.error(errorMessage, { id: 'rest-referral-profile' });
        throw new Error(errorMessage);
      }

      const data = response.data;
      return data
        ? {
            ...data,
            user_address: toChecksumAddress(data.user_address),
            direct_referrer_address: toChecksumAddress(
              data.direct_referrer_address,
            ),
            indirect_referrer_address: toChecksumAddress(
              data.indirect_referrer_address,
            ),
          }
        : null;
    },
    staleTime: 0,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
    refetchOnWindowFocus: false,
  });
};
