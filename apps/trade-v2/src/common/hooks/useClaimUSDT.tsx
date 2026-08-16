'use client';

import TokenAbi from '@hertzflow/sdk-v2/abis/Token';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { useMutation } from '@repo/lib/queryClient';
import { useCurrentAccountAddress, useHzSdk } from '@/common/chainClient';
import { useInstStore } from '@/common/stores';
import { useCustomSignAndExecuteTransaction } from './useExecTransaction';
import type { Abi, Address } from 'viem';

export const useClaimUSDT = () => {
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const hzSdk = useHzSdk();
  const userAddress = useCurrentAccountAddress();
  const usdtCoin = useInstStore((state) => state.getUsdtCoin(state));
  return useMutation({
    mutationKey: ['claimUSDT'],
    mutationFn: async () => {
      const title = i18n._(msg`Get Test Funds`);
      return await executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(
            msg`Faucets successfully claimed! Have fun trading!`,
          ),
          errorDescription: i18n._(
            msg`Error occurred. Please refresh page and try again.`,
          ),
          icon: (
            <CoinIcon size={24} src={usdtCoin?.icon} alt={usdtCoin?.name} />
          ),
          id: 'toast-claim-usdt',
        },
        executeTransaction: async () => {
          if (!userAddress) {
            throw new Error(i18n._(msg`Wallet is not connected`));
          }
          if (usdtCoin?.decimal === undefined) {
            throw new Error(i18n._(msg`USDT config is missing`));
          }
          if (!hzSdk) {
            throw new Error(i18n._(msg`SDK is not available`));
          }

          const amount = BigInt(
            calc(100).times(calc(10).pow(usdtCoin.decimal)).toFixed(0),
          );

          return hzSdk.callContract(
            usdtCoin.address as Address,
            TokenAbi as Abi,
            'mint',
            [userAddress, amount],
          );
        },
      });
    },
  });
};
