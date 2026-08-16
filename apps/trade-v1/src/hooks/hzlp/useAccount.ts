import { useMemo } from 'react';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { normalizeStructTag } from '@mysten/sui/utils';

export const useIsConnect = () => {
  const currentAccount = useCurrentAccount();

  return !!currentAccount;
};

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
    if (!normalizeBalances || !coinTypes) {
      return normalizeBalances;
    }
    return coinTypes.map((coinType) => {
      return normalizeBalances.find((v) => v.coinType === coinType);
    });
  }, [balances, coinTypes]);

  return filteredBalances;
};
