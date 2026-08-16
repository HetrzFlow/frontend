import { useLingui } from '@lingui/react/macro';
import { withTimeout } from 'viem';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useMutation } from '@repo/lib/queryClient';
import { tradeToast } from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  useGlobalStore,
  useHzSdk,
  useInstStore,
  usePriceTickerStream,
  getUsdPriceSymbol,
} from '@/common';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { TIMEOUT } from '@/lib/trade/transaction';
import {
  useClaimStats,
  useClaimableFundingFees,
  useClaimHistory,
} from '@/services/rest/claim';
import { useClaimOptimistic } from './optimistic';
import { ClaimDetailType } from './type';

export const useFormatClaimDetails = (
  details: Record<string, ClaimDetailType[]>,
) => {
  const coins = useInstStore((state) => state.getCoins());
  const tokenAddresses = Object.values(details)
    .flatMap((v) => v)
    .map((v) => v.tokenAddress);
  const { data: tokenPrices = [] } = usePriceTickerStream(
    tokenAddresses.map((v) => {
      const symbol = coins[v]?.symbol;
      return getUsdPriceSymbol(symbol);
    }),
  );
  return Object.values(details).map((v) => {
    return {
      marketAddress: v[0]?.marketAddress,
      usd: v.reduce((acc, cur) => {
        const tokenPx =
          tokenPrices[tokenAddresses.indexOf(cur.tokenAddress)]?.[0]?.p;
        return calc(acc).plus(
          cur.usd ??
            (tokenPx && coins[cur.tokenAddress]?.decimals
              ? calc(cur.amount)
                  .div(calc(10).pow(coins[cur.tokenAddress]!.decimals))
                  .times(tokenPx)
              : 0),
        );
      }, calc(0)),
    };
  });
};

export const useClaim = () => {
  const hzSdk = useHzSdk();
  const { t } = useLingui();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const {
    setClaimOptimistic,
    claimedPriceImpactKeys,
    optimisticTotalClaimedUsd,
  } = useClaimOptimistic();
  const { data: claimStats, refetch: refetchClaimStats } = useClaimStats({
    claimedPriceImpactKeys,
    optimisticTotalClaimedUsd,
  });
  const { data: claimableFundingFees, refetch: refetchClaimableFundingFees } =
    useClaimableFundingFees();
  const {
    query: { refetch: refetchClaimedData },
  } = useClaimHistory();

  return useMutation({
    mutationKey: ['claim', 'fundingFeeAndCollateral'],
    mutationFn: async (params?: {
      claimType?: 'funding_fees' | 'collateral';
      claimedUsd?: string;
      marketAddress?: string;
      tokenAddress?: string;
      timeKey?: number;
    }) => {
      const claimType = params?.claimType;
      const claimedUsdParam = params?.claimedUsd;
      const targetMarket = params?.marketAddress;
      const targetToken = params?.tokenAddress;
      const targetTimeKey = params?.timeKey;
      const fundingFeeParams: [string, string][] = [];
      const priceImpactRebateParams: [string, string, bigint][] = [];

      if (
        claimType === 'collateral' &&
        targetMarket &&
        (!targetToken || targetTimeKey === undefined)
      ) {
        throw new Error(
          'Token address and time key are required to claim price impact',
        );
      }

      if (!claimType || claimType === 'funding_fees') {
        const filtered = targetMarket
          ? claimableFundingFees?.filter(
              (v) => v.marketAddress === targetMarket,
            )
          : claimableFundingFees;
        const p =
          filtered?.map((v) => {
            const claims: [string, string][] = [];
            if (BigInt(v.claimableFundingAmountLong) > 0n) {
              claims.push([v.marketAddress, v.longTokenAddress]);
            }
            if (
              v.shortTokenAddress !== v.longTokenAddress &&
              BigInt(v.claimableFundingAmountShort) > 0n
            ) {
              claims.push([v.marketAddress, v.shortTokenAddress]);
            }
            return claims;
          }) || [];
        fundingFeeParams.push(...p.flatMap((v) => v));
      }

      if (!claimType || claimType === 'collateral') {
        const filtered = targetMarket
          ? claimStats?.claimablePriceImpact?.filter(
              (v) =>
                v.market_address === targetMarket &&
                v.token_address === targetToken &&
                v.time_key === targetTimeKey,
            )
          : claimStats?.claimablePriceImpact;
        const p =
          filtered?.map((v) => {
            return [v.market_address, v.token_address, BigInt(v.time_key)] as [
              string,
              string,
              bigint,
            ];
          }) || [];
        priceImpactRebateParams.push(...p);
      }

      if (
        !hzSdk ||
        (!fundingFeeParams.length && !priceImpactRebateParams.length)
      ) {
        return;
      }

      await executeTransaction({
        toast: {
          title: t`Accrued Fees`,
          successDescription: t`Claimed`,
          description: t`Claiming`,
          id: 'toast-claimFees',
        },
        executeTransaction: async () => {
          return await withTimeout(
            () =>
              hzSdk.claim.claimAllRebates({
                fundingFeeParams,
                priceImpactRebateParams,
              }),
            {
              timeout: TIMEOUT,
              errorInstance: new Error('timeout'),
            },
          );
        },
        onSuccess: async (txHash) => {
          // Set optimistic state immediately
          const priceImpactKeys = priceImpactRebateParams.map(
            ([market, token, timeKey]) => `${market}-${token}-${timeKey}`,
          );

          setClaimOptimistic({
            priceImpactKeys,
            claimedUsd: calc(claimedUsdParam ?? '0')
              .times(CONTRACT_USD_MULTIPLIER)
              .toFixed(),
            currentTotalClaimedUsd: claimStats?.totalClaimedUsd ?? '0',
          });

          refetchClaimStats();
          refetchClaimableFundingFees();
          refetchClaimedData();

          const claimedUsd = truncateFormat(
            claimedUsdParam ?? '0',
            usdAmountDisplayDecimal,
            {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
              showMinDecimalValue: true,
            },
          );

          let text = '';
          if (claimType === 'funding_fees') {
            text = t`Claimed funding fee: ${claimedUsd}`;
          } else if (claimType === 'collateral') {
            text = t`Claimed price impact: ${claimedUsd}`;
          } else {
            text = t`Claimed funding fee and price impact: ${claimedUsd}`;
          }

          // Show custom toast with claim details
          tradeToast(
            {
              type: 'success',
              title: t`Accrued Fees`,
              description: t`Claimed`,
              content: <p>{text}</p>,
              href: txHash as `0x${string}`,
            },
            {
              id: 'toast-claimFees',
            },
          );
        },
      });
    },
  });
};
