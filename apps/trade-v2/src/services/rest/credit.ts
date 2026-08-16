import { CREDIT_TOKEN_DECIMALS } from '@hertzflow/sdk-v2';
import { formatUnits } from 'viem';
import { truncateFormat } from '@repo/lib/format';
import { get } from '@repo/lib/rest';
import { HZFL_TOKEN_DECIMALS, ZERO_STR } from '@/common/constants';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import {
  getCreditWindowStatus,
  hasPositiveRawAmount,
} from '@/containers/credit/claimState';
import type { CreditAirdrop, CreditBalance } from '@/containers/credit/types';
import { toLowerAddressParam } from '@/lib/address';

type ApiResponse<T> = {
  data: T;
};

type BackendCreditBalanceResponse = {
  current_balance: string;
  total_consumed: string;
  realized_profits: string;
  accumulated_fee_rebate: string;
  claimed_fee_rebate: string;
  claimable_fee_rebate: string;
  max_claimable_fee_rebate: string;
  total_credit_allocated: string;
  total_hzfl_allocated: string;
};

type BackendCreditAirdropResponse = {
  season_id: number;
  credit_amount: string;
  hzfl_amount: string;
  claim_start_at: number;
  claim_end_at: number;
  is_credit_claimed: boolean;
  is_hzfl_claimed: boolean;
  is_hzfl_enabled: boolean;
  is_window_open: boolean;
};

const toHumanAmount = (value: string, decimals = CREDIT_TOKEN_DECIMALS) => {
  try {
    return formatUnits(BigInt(value), decimals);
  } catch {
    return value.replace(/,/g, '');
  }
};

const normalizeDisplayAmount = (
  value: string,
  decimals = CREDIT_TOKEN_DECIMALS,
) =>
  truncateFormat(toHumanAmount(value, decimals), 2, {
    stripTrailingZeros: true,
  });

const withUnit = (value: string, unit: string) =>
  `${normalizeDisplayAmount(value, CREDIT_TOKEN_DECIMALS)} ${unit}`;

const toIsoDate = (timestamp: number) => new Date(timestamp).toISOString();

export const fetchCreditAirdrop = async ({
  userAddress,
  seasonId,
}: {
  userAddress: string;
  seasonId: string;
}): Promise<CreditAirdrop> => {
  const response = await get<ApiResponse<BackendCreditAirdropResponse>>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/credit/airdrop`,
    {
      user_address: toLowerAddressParam(userAddress),
      season_id: Number(seasonId),
    },
  );

  const data = response.data;
  const windowStatus = getCreditWindowStatus({
    startAt: data.claim_start_at,
    endAt: data.claim_end_at,
  });

  return {
    seasonId: String(data.season_id),
    seasonName: `Season ${data.season_id}`,
    creditAmount: data.is_credit_claimed
      ? ZERO_STR
      : normalizeDisplayAmount(data.credit_amount),
    creditEarnedAmount: toHumanAmount(data.credit_amount),
    hzflAmount: data.is_hzfl_claimed
      ? ZERO_STR
      : normalizeDisplayAmount(data.hzfl_amount),
    hasCreditAmount: hasPositiveRawAmount(data.credit_amount),
    hasHzflAmount: hasPositiveRawAmount(data.hzfl_amount),
    windowOpenAt: toIsoDate(data.claim_start_at),
    windowCloseAt: toIsoDate(data.claim_end_at),
    windowStatus,
    creditClaimed: data.is_credit_claimed,
    hzflClaimed: data.is_hzfl_claimed,
    hzflEnabled: data.is_hzfl_enabled,
  };
};

export const fetchCreditBalance = async (
  userAddress: string,
): Promise<CreditBalance> => {
  const response = await get<ApiResponse<BackendCreditBalanceResponse>>(
    `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/credit/balance`,
    { user_address: toLowerAddressParam(userAddress) },
  );

  const data = response.data;

  return {
    currentBalance: normalizeDisplayAmount(data.current_balance),
    consumedCredit: withUnit(data.total_consumed, 'Credit'),
    realizedProfits: withUnit(data.realized_profits, 'USDT'),
    realizedFeeRebate: withUnit(data.claimed_fee_rebate, 'USDT'),
    accumulatedFeeRebate: normalizeDisplayAmount(data.claimable_fee_rebate),
    maxFeeRebate: normalizeDisplayAmount(data.max_claimable_fee_rebate),
    totalCreditAllocated: normalizeDisplayAmount(data.total_credit_allocated),
    totalHzflAllocated: normalizeDisplayAmount(
      data.total_hzfl_allocated,
      HZFL_TOKEN_DECIMALS,
    ),
  };
};
