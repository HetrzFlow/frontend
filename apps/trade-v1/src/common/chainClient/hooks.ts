'use client';

import { useCallback, useContext, useMemo } from 'react';
import { HertzFlowSDK } from '@hertzflow/sdk';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

import { calc } from '@repo/lib/calc';
import { HzSdkContext } from './HzSdkProvider';
import type { Transaction } from '@mysten/sui/transactions';

export const NORMALIZED_SUI_TYPE_ARG = normalizeStructTag(SUI_TYPE_ARG);

// hzsdk
export const useHzSdk = () => {
  return useContext(HzSdkContext) as HertzFlowSDK;
};

// connected
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

// set basic tx settings
export const useSetTxBasicParams = () => {
  const currentAccount = useCurrentAccount();
  const [suiBalance] = useBalances([NORMALIZED_SUI_TYPE_ARG]) || [];

  return useCallback(
    (tx: Transaction, { gasBudget = 1e8 } = {}) => {
      if (currentAccount?.address) {
        tx.setSender(currentAccount.address);
      }
      if (suiBalance && calc(suiBalance.totalBalance).gt(1e6)) {
        tx.setGasBudget(
          BigInt(calc.min(gasBudget, suiBalance.totalBalance).toFixed()),
        );
      }

      return tx;
    },
    [currentAccount?.address, suiBalance],
  );
};
