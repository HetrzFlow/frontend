'use client';

import { useMemo } from 'react';
import { useInfiniteQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';

const SUCCESS_CODE = 200;
const REFERRAL_CODES_PAGE_SIZE = 10;

type ReferralCodesApiResponse = {
  code?: number;
  error?: string;
  msg?: string;
  message?: string;
  data?: Omit<ReferralCodesPage, 'items'> & {
    items?: ReferralCodesPage['items'] | null;
  };
};

export type ReferralCodeItem = {
  referral_code: string;
  raw_referral_code: string;
  owner_address: string;
  created_at_ms: number;
  updated_at_ms: number;
  code_status: string;
  bound_user_count: number;
  active_bound_user_count: number;
  cumulative_trade_size_usd: string;
  cumulative_referred_fee_usd: string;
  cumulative_affiliate_reward_usd: string;
  volume_usd: string;
  referred_count: number;
  rewards_usd: string;
  share_link: string;
};

type ReferralCodesPage = {
  items: ReferralCodeItem[];
  next_cursor: string | null;
  has_more: boolean;
};

const EMPTY_REFERRAL_CODES_PAGE: ReferralCodesPage = {
  items: [],
  next_cursor: null,
  has_more: false,
};

const getReferralCodesNextCursor = (lastPage: ReferralCodesPage) => {
  if (!lastPage.has_more) return undefined;
  return lastPage.next_cursor || undefined;
};

export const useReferralCodes = () => {
  const userAddress = useCurrentAccountAddress();
  const userAddressParam = toLowerAddressParam(userAddress);

  const query = useInfiniteQuery({
    queryKey: ['rest', 'referral-codes', userAddressParam],
    enabled: !!userAddress,
    queryFn: async ({ pageParam }) => {
      const response = await get<ReferralCodesApiResponse>(
        `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/user/referral-codes`,
        {
          user_address: toLowerAddressParam(userAddress),
          cursor: pageParam || undefined,
          limit: REFERRAL_CODES_PAGE_SIZE,
        },
      );

      const errorMessage =
        response.error ||
        (response.code !== undefined && response.code !== SUCCESS_CODE
          ? response.msg || response.message || 'Failed to fetch referral codes'
          : undefined);

      if (errorMessage) {
        toast.error(errorMessage, { id: 'rest-referral-codes' });
        throw new Error(errorMessage);
      }

      const data = response.data;
      return data
        ? {
            ...data,
            items: (data.items ?? []).map((item) => ({
              ...item,
              owner_address: toChecksumAddress(item.owner_address),
            })),
          }
        : EMPTY_REFERRAL_CODES_PAGE;
    },
    initialPageParam: '',
    getNextPageParam: getReferralCodesNextCursor,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.items) ?? [];
  }, [query.data]);

  return {
    ...query,
    items,
  };
};
