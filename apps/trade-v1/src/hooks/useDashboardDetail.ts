import { useQuery } from '@tanstack/react-query';
import { toast } from '@repo/ui';
import { useHzSdk } from '@/common';
import { useDashboardDateRange } from './useDashboardDateRange';

export const useDashboardDetail = () => {
  const { fromTimestamp, toTimestamp } = useDashboardDateRange();
  const hzSdk = useHzSdk();
  return useQuery({
    queryKey: [
      'rest',
      'dashboardDetail',
      hzSdk.fullClient.network,
      fromTimestamp,
      toTimestamp,
    ],
    queryFn: async () => {
      if (!fromTimestamp || !toTimestamp) {
        throw new Error('Date range is required');
      }
      try {
        const data = hzSdk.ApiModule.fetchDashboardDetail({
          from: fromTimestamp,
          to: toTimestamp,
        });
        return data;
      } catch (error) {
        toast.error((error as Error).message, { id: 'rest-dashboardDetail' });
        throw error;
      }
    },
    refetchInterval: 60000,
  });
};
