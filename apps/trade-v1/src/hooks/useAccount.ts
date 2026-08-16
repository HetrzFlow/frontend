import { useMemo } from 'react';
import {
  useCurrentAccount,
  useSuiClientContext,
  useSuiClientQuery,
} from '@mysten/dapp-kit';
import { normalizeStructTag } from '@mysten/sui/utils';
import { useQuery } from '@tanstack/react-query';
import { useSuinsClient } from '@/components/SuinsClientProvider';
import { fetchSuiNameAndAvatar } from '@/lib/sui';

// connect to wallet
export const useIsConnect = () => {
  const currentAccount = useCurrentAccount();

  return !!currentAccount;
};

// balances
export const useBalances = (coinTypes?: string[]) => {
  const currentAccount = useCurrentAccount();

  const { data: balances } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });

  const filteredBalances = useMemo(() => {
    const normalizeBalances = balances?.map((v) => {
      v.coinType = normalizeStructTag(v.coinType);
      return v;
    });
    // balances is undefined, or no coinTypes, return balances
    if (!normalizeBalances || !coinTypes) {
      return normalizeBalances;
    }
    return coinTypes.map((coinType) => {
      return normalizeBalances.find((v) => v.coinType === coinType);
    });
  }, [balances, coinTypes?.join()]);

  return filteredBalances;
};

// sui name and avatar
export const useNameAndAvatar = () => {
  const { client: suiClient, network } = useSuiClientContext();
  const suinsClient = useSuinsClient();
  const currentAccount = useCurrentAccount();
  return useQuery({
    queryKey: [network, 'resolveNameServiceNames', currentAccount?.address],
    queryFn: async () => {
      return fetchSuiNameAndAvatar({
        suiClient,
        suinsClient,
        address: currentAccount?.address!,
      });
    },
    enabled: !!currentAccount?.address,
  });
};
