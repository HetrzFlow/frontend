import { get } from '@repo/lib/rest';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';

const SUCCESS_CODE = 200;

type ReferralTierRulesApiResponse = {
  code?: number;
  error?: string;
  msg?: string;
  message?: string;
  data?: ReferralTierRules;
};

export type ReferralTierRule = {
  tier_id: number;
  tier_name: string;
  min_active_referred_traders: number;
  min_rolling_30d_referred_volume_usd: string;
  l1_rebate_bps: number;
  l2_rebate_bps: number;
  trader_discount_bps: number;
  is_default: boolean;
};

export type ReferralTierRules = {
  rule_set_name: string;
  rule_source: string;
  updated_at_ms: number;
  tiers: ReferralTierRule[];
};

export async function fetchReferralTierRules() {
  const response = await get<ReferralTierRulesApiResponse>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/referral/tier-rules`,
  );

  const errorMessage =
    response.error ||
    (response.code !== undefined && response.code !== SUCCESS_CODE
      ? response.msg || response.message || 'Failed to fetch referral tier rules'
      : undefined);

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return response.data ?? null;
}
