import { useQuery } from '@repo/lib/queryClient';
import { useCurrentAccountAddress, useHzSdk } from '@/common';
import type { UserReferralInfo } from '@hertzflow/sdk-v2/types/referral';

export const useUserReferralInfo = () => {
  const hzSdk = useHzSdk();
  const account = useCurrentAccountAddress();

  return useQuery<UserReferralInfo | null>({
    queryKey: ['user-referral-info', hzSdk?.chainId, account],
    enabled: !!hzSdk && !!account,
    queryFn: async () => {
      return (await hzSdk!.referral.getUserReferralInfo()) ?? null;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};
