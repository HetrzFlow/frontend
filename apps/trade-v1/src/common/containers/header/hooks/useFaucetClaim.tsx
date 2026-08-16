import { useCallback, useState, useEffect } from 'react';
import {
  MOCK_USDC_TYPE,
  MOCK_ETH_TYPE,
  MOCK_BTC_TYPE,
  COMMON_CONSTS,
} from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from '@repo/ui';
import { useHzSdk, useSetTxBasicParams } from '../../../chainClient/hooks';
import { useCustomSignAndExecuteTransaction } from '../../../hooks/useExecTransaction';

// constants
export const FAUCET_COINS = [
  {
    symbol: 'BTC',
    coin_amount: '0.0003',
  },
  {
    symbol: 'ETH',
    coin_amount: '0.01',
  },
  {
    symbol: 'USDC',
    coin_amount: '35',
  },
] as const;

export const MIN_SUI_BALANCE = 0.1;

export interface UserClaimInfo {
  userAddress: string;
  lastClaimTime: number;
  nextClaimTime: number;
}

export interface FaucetClaimState {
  isLoading: boolean;
  userClaimInfo: UserClaimInfo | null;
  isQueryingClaimInfo: boolean;
  isEligible: boolean;
  countdown: string;
}

export interface ClaimResult {
  success: boolean;
  digest?: string;
  error?: string;
}

export const useFaucetClaim = () => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const setTxBasicParams = useSetTxBasicParams();
  const currentAccount = useCurrentAccount();
  const [claimState, setClaimState] = useState<FaucetClaimState>({
    isLoading: false,
    userClaimInfo: null,
    isQueryingClaimInfo: false,
    isEligible: true,
    countdown: '',
  });

  const { data: balances, refetch: refetchBalances } = useSuiClientQuery(
    'getAllBalances',
    {
      owner: currentAccount?.address || '',
    },
    {
      enabled: !!currentAccount?.address,
    },
  );

  const { mutate: signAndExecute, isPending } =
    useCustomSignAndExecuteTransaction({
      mutationKey: ['faucetClaim'],
    });

  const queryUserClaimInfo = useCallback(async () => {
    if (!currentAccount?.address) {
      return;
    }

    try {
      setClaimState((prev) => ({ ...prev, isQueryingClaimInfo: true }));

      const lastClaimTime = await hzSdk.FaucetModule.queryUserLastClaim(
        currentAccount.address,
      );
      const claimInterval = 24 * 60 * 60; // 24h, unit: s
      const nextClaimTime = lastClaimTime + claimInterval;

      const claimInfo: UserClaimInfo = {
        userAddress: currentAccount.address,
        lastClaimTime,
        nextClaimTime,
      };

      setClaimState((prev) => ({
        ...prev,
        userClaimInfo: claimInfo,
        isQueryingClaimInfo: false,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setClaimState((prev) => ({
        ...prev,
        userClaimInfo: null,
        isQueryingClaimInfo: false,
      }));
    }
  }, [currentAccount?.address, hzSdk.FaucetModule]);

  useEffect(() => {
    if (currentAccount && balances) {
      const suiBalance = balances.find(
        (balance) => balance.coinType === COMMON_CONSTS.SUI_TYPE_ARG_LONG,
      );
      const suiAmount = suiBalance ? Number(suiBalance.totalBalance) / 1e9 : 0;
      setClaimState((prev) => ({
        ...prev,
        isEligible: suiAmount >= MIN_SUI_BALANCE,
      }));
    } else {
      setClaimState((prev) => ({ ...prev, isEligible: true }));
    }
  }, [currentAccount, balances]);

  const formatCountdown = useCallback((seconds: number): string => {
    if (seconds <= 0) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const nextClaimTime = claimState.userClaimInfo?.nextClaimTime;
    if (!nextClaimTime) {
      setClaimState((prev) => ({ ...prev, countdown: '' }));
      return;
    }

    const updateCountdown = () => {
      const now = Date.now() / 1000;
      const timeLeft = nextClaimTime - now;

      if (timeLeft <= 0) {
        setClaimState((prev) => ({ ...prev, countdown: '00:00:00' }));
        return;
      }

      setClaimState((prev) => ({
        ...prev,
        countdown: formatCountdown(timeLeft),
      }));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [claimState.userClaimInfo?.nextClaimTime, formatCountdown]);

  useEffect(() => {
    queryUserClaimInfo();
  }, [queryUserClaimInfo]);

  const claimAllTokens = useCallback(() => {
    try {
      setClaimState((prev) => ({ ...prev, isLoading: true }));
      let tx = new Transaction();
      tx = setTxBasicParams(tx);
      tx = hzSdk.FaucetModule.createClaimAllTokensPayload({
        tokenType1: MOCK_USDC_TYPE,
        tokenType2: MOCK_ETH_TYPE,
        tokenType3: MOCK_BTC_TYPE,
        tx,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (txResult) => {
            if (txResult.status === 'failed') {
              toast.error(t`Transaction failed`);
              return;
            }

            refetchBalances();
            queryUserClaimInfo();
          },
          onError: (e) => {
            toast.error(e.message ?? t`'Transaction error'`);
          },
        },
        {
          ordType: 'market',
          title: t`Claim Faucet`,
          resultDescription: t`Faucets successfully claimed! Have fun trading!`,
          errorDescription: t`Error occured. Please refresh page and try again.`,
        },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t`Unknown error`);
    } finally {
      setClaimState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [
    t,
    setTxBasicParams,
    hzSdk.FaucetModule,
    signAndExecute,
    refetchBalances,
    queryUserClaimInfo,
  ]);

  const canClaim = useCallback((): boolean => {
    const nextClaimTime = claimState.userClaimInfo?.nextClaimTime;
    if (!nextClaimTime) {
      return false;
    }
    const currentTime = Date.now() / 1000;
    return currentTime >= nextClaimTime;
  }, [claimState.userClaimInfo?.nextClaimTime]);

  const getNextClaimTime = useCallback(() => {
    if (!claimState.userClaimInfo?.nextClaimTime) {
      return null;
    }
    return claimState.userClaimInfo.nextClaimTime;
  }, [claimState.userClaimInfo?.nextClaimTime]);

  const resetState = useCallback(() => {
    setClaimState({
      isLoading: false,
      userClaimInfo: null,
      isQueryingClaimInfo: false,
      isEligible: true,
      countdown: '',
    });
  }, []);

  return {
    claimState,
    isPending:
      isPending || claimState.isLoading || claimState.isQueryingClaimInfo,
    isLoading: claimState.isLoading,

    userClaimInfo: claimState.userClaimInfo,
    isQueryingClaimInfo: claimState.isQueryingClaimInfo,

    isEligible: claimState.isEligible,
    countdown: claimState.countdown,

    claimAllTokens,
    queryUserClaimInfo,
    canClaim,
    getNextClaimTime,
    resetState,
  };
};
