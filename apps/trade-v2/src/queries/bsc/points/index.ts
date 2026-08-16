import { useQuery } from '@repo/lib/queryClient';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import {
  DYNAMIC_DATA_CACHE_TIME,
  STATIC_CONFIG_CACHE_TIME,
} from '@/common/constants/timeConstants';
import { fetchSeasonList, fetchSeasonPoint } from '@/services/rest/points';

export const useSeasonList = () => {
  return useQuery({
    queryKey: ['seasonList'],
    queryFn: fetchSeasonList,
    refetchInterval: STATIC_CONFIG_CACHE_TIME,
    staleTime: STATIC_CONFIG_CACHE_TIME,
  });
};

export const useSeasonPoint = (seasonId: string) => {
  const address = useCurrentAccountAddress();
  return useQuery({
    queryKey: ['seasonPoint', address, seasonId],
    queryFn: () => fetchSeasonPoint(address!, seasonId),
    enabled: !!address && !!seasonId,
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
    staleTime: DYNAMIC_DATA_CACHE_TIME,
  });
};
