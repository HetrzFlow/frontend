'use client';

import { useQuery } from '@repo/lib/queryClient';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { fetchMeritsRank } from '@/services/rest/leaderboard';

const MERITS_RANK_REFRESH_INTERVAL = 5 * 60 * 1000;

export const useMeritsRank = (options?: { enabled?: boolean }) => {
  const address = useCurrentAccountAddress();

  return useQuery({
    queryKey: ['rest', 'leaderboard', 'merits-rank', address],
    queryFn: () => fetchMeritsRank(address),
    enabled: Boolean(address) && (options?.enabled ?? true),
    staleTime: MERITS_RANK_REFRESH_INTERVAL,
    refetchInterval: MERITS_RANK_REFRESH_INTERVAL,
  });
};
