import { useCurrentAccount } from '@mysten/dapp-kit';
import { queryClient, useQuery } from '@repo/lib/queryClient';
// import { get } from '@repo/lib/rest';

// trade coin approve
export const useNeedApprove = (coinType?: string) => {
  const currentAccount = useCurrentAccount();
  return useQuery({
    queryKey: ['rest', 'needApprove', currentAccount?.address, coinType],
    enabled: !!currentAccount?.address && !!coinType,
    queryFn: async () => {
      // return get(`${API_BASE_URL}/xxx`)
      return Promise.resolve(false);
    },
  });
};

// get needApprove from cache
export const getNeedApproveFromCache = ({
  accountAddress,
  coinType,
}: {
  accountAddress: string;
  coinType: string;
}) => {
  return queryClient.getQueryData([
    'rest',
    'needApprove',
    accountAddress,
    coinType,
  ]) as boolean;
};
