'use client';

import { useQuery } from '@repo/lib/queryClient';
import { get } from '@repo/lib/rest';
import { toast } from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { BSC_DATA_QUERY_API_BASE_URL } from '@/constants/common';
import { toChecksumAddress, toLowerAddressParam } from '@/lib/address';

const SUCCESS_CODE = 200;

type ReferralNetworkApiResponse = {
  code?: number;
  error?: string;
  msg?: string;
  message?: string;
  data?: Omit<ReferralNetworkData, 'nodes'> & {
    nodes?: ReferralNetworkData['nodes'] | null;
  };
};

type ReferralNetworkNodeLevel = 'you' | 'l1' | 'l2';

export type ReferralNetworkNode = {
  user_address: string;
  level: ReferralNetworkNodeLevel;
  parent_address?: string;
  is_overflow: boolean;
  overflow_count?: number;
  is_leader: boolean;
};

export type ReferralNetworkData = {
  today_reward_usd: string;
  updated_at_ms: number;
  nodes: ReferralNetworkNode[];
};

export const useReferralNetwork = () => {
  const userAddress = useCurrentAccountAddress();
  const userAddressParam = toLowerAddressParam(userAddress);

  return useQuery<ReferralNetworkData | null>({
    queryKey: ['rest', 'referral-network', userAddressParam],
    enabled: !!userAddress,
    queryFn: async () => {
      const response = await get<ReferralNetworkApiResponse>(
        `${BSC_DATA_QUERY_API_BASE_URL}/api/v1/bsc/user/referral-network`,
        {
          user_address: toLowerAddressParam(userAddress),
        },
      );

      const errorMessage =
        response.error ||
        (response.code !== undefined && response.code !== SUCCESS_CODE
          ? response.msg ||
            response.message ||
            'Failed to fetch referral network'
          : undefined);

      if (errorMessage) {
        toast.error(errorMessage, { id: 'rest-referral-network' });
        throw new Error(errorMessage);
      }

      const data = response.data;
      return data
        ? {
            ...data,
            nodes: (data.nodes ?? []).map((node) => ({
              ...node,
              user_address: toChecksumAddress(node.user_address),
              parent_address: node.parent_address
                ? toChecksumAddress(node.parent_address)
                : undefined,
            })),
          }
        : null;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
};
