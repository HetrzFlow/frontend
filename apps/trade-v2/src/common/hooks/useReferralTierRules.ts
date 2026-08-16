'use client';

import { useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  fetchReferralTierRules,
  type ReferralTierRule,
  type ReferralTierRules,
} from '@/services/rest/referralTierRules';

export type { ReferralTierRule, ReferralTierRules };

export const useReferralTierRules = (initialData?: ReferralTierRules | null) => {
  return useQuery<ReferralTierRules | null>({
    queryKey: ['rest', 'referral-tier-rules'],
    queryFn: async () => {
      try {
        return await fetchReferralTierRules();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to fetch referral tier rules',
          { id: 'rest-referral-tier-rules' },
        );
        throw error;
      }
    },
    initialData,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
};
