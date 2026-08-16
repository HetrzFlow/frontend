'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans } from '@lingui/react/macro';
import { Address } from 'viem';
import { unitFormat } from '@repo/lib/format';
import { SkeletonLayout } from '@repo/ui';
import { useGlobalStore, useInstStore } from '@/common';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import { useHydrated } from '@/common/hooks/useHydrated';
import { usePriceStore } from '@/common/stores/priceStore';
import { convertBigintToHumanReadable } from '@/lib/shared/utils';
import { usePoolDetail } from '@/queries/bsc/pools';
import { useInternalUsdConfigForToken } from '@/queries/bsc/vaults';
import { USDT_NAME } from '@/stores/pools/trade';
import {
  calculatePoolRestHoldingsUsd,
  getVaultListItem,
  parseRawValue,
  useVaultsListData,
} from '@/stores/synthetics/marketsData/selectors';
import {
  usePoolUserPerformance,
  useVaultUserPerformance,
} from '@/stores/synthetics/userPerformance/selectors';
import { ActivityTabType } from '../PoolsDetail/components/ActivityPanel';

export default function MarketTokenHoldings({
  type,
}: {
  type: ActivityTabType;
}) {
  const id = useParams();
  const marketAddress = id?.market_address as Address | undefined;
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state,
  ).usdAmountDisplayDecimal;
  const mounted = useHydrated();
  const usdtCoin = useInstStore((state) => state.getUsdtCoin(state));
  const coins = useInstStore((state) => state.getCoins());
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const isVault = type === ActivityTabType.VAULT;
  const connectionStatus = useConnectionStatus();
  const vaultPerformance = useVaultUserPerformance(
    isVault ? marketAddress : undefined,
  );
  const poolPerformance = usePoolUserPerformance(
    !isVault ? marketAddress : undefined,
  );
  const { data: poolDetail } = usePoolDetail(
    !isVault ? (marketAddress ?? '') : '',
    {
      refetchInterval: false,
    },
  );
  const pool = !isVault ? poolDetail?.pool : undefined;
  const vaultsList = useVaultsListData();
  const vaultListItem = useMemo(
    () => (isVault ? getVaultListItem(vaultsList, marketAddress) : undefined),
    [isVault, marketAddress, vaultsList],
  );
  const collateralTokenAddress = useMemo(
    () =>
      isVault
        ? vaultListItem?.market_exposure.find(
            (exposure) => exposure.short_token,
          )?.short_token
        : undefined,
    [isVault, vaultListItem?.market_exposure],
  );
  const internalUsdConfigQuery = useInternalUsdConfigForToken(
    collateralTokenAddress,
  );
  const underlyingTokenAddress = useMemo(() => {
    if (
      !isVault ||
      !collateralTokenAddress ||
      !internalUsdConfigQuery.isSuccess
    ) {
      return undefined;
    }
    return (
      internalUsdConfigQuery.data?.underlyingTokenAddress ??
      collateralTokenAddress
    );
  }, [
    collateralTokenAddress,
    internalUsdConfigQuery.data?.underlyingTokenAddress,
    internalUsdConfigQuery.isSuccess,
    isVault,
  ]);
  const underlyingToken = useMemo(() => {
    if (!underlyingTokenAddress) return undefined;
    return (
      coins[underlyingTokenAddress] ??
      coins[underlyingTokenAddress.toLowerCase()]
    );
  }, [coins, underlyingTokenAddress]);
  const displayCoin = isVault ? underlyingToken : usdtCoin;

  // -----------------------------
  // Unified view for UI rendering
  // -----------------------------
  const performance = isVault ? vaultPerformance : poolPerformance;
  const backendPoolDepositsUsd = useMemo(
    () => (!isVault ? calculatePoolRestHoldingsUsd(pool) : undefined),
    [isVault, pool],
  );
  const depositsUsd = performance?.depositsUsd ?? backendPoolDepositsUsd;
  const earnedFeesUsd = useMemo(() => {
    if (!isVault) {
      if (connectionStatus === 'disconnected') return 0n;
      if (connectionStatus === 'unknown') return undefined;
      return parseRawValue(pool?.unrealized_pnl);
    }
    if (connectionStatus === 'disconnected') return 0n;
    if (connectionStatus === 'unknown') return undefined;
    return parseRawValue(vaultListItem?.unrealized_pnl);
  }, [
    connectionStatus,
    isVault,
    pool?.unrealized_pnl,
    vaultListItem?.unrealized_pnl,
  ]);
  const displayTokenPrice = displayCoin?.address
    ? pricesMap[displayCoin.address]?.maxPrice
    : undefined;
  const displayTokenDecimals =
    displayCoin?.decimals ?? (isVault ? undefined : 18);
  const depositsTokenAmount = useMemo(() => {
    if (depositsUsd === 0n) return 0n;
    if (depositsUsd === undefined) {
      return undefined;
    }
    if (displayTokenDecimals === undefined) return undefined;
    if (displayTokenPrice === undefined || displayTokenPrice <= 0n) {
      return (
        (depositsUsd * 10n ** BigInt(displayTokenDecimals)) /
        10n ** BigInt(USD_DECIMALS)
      );
    }
    return (
      (depositsUsd * 10n ** BigInt(displayTokenDecimals)) / displayTokenPrice
    );
  }, [depositsUsd, displayTokenDecimals, displayTokenPrice]);
  const depositsLoading = depositsTokenAmount === undefined;
  const earnedFeesLoading = earnedFeesUsd === undefined;
  const depositsDisplay = useMemo(() => {
    if (
      depositsTokenAmount === undefined ||
      displayTokenDecimals === undefined
    ) {
      return '';
    }
    return unitFormat(
      convertBigintToHumanReadable(depositsTokenAmount, displayTokenDecimals),
      usdAmountDisplayDecimal,
      {
        showMinDecimalValue: true,
        stripTrailingZeros: true,
      },
    );
  }, [depositsTokenAmount, displayTokenDecimals, usdAmountDisplayDecimal]);
  const earnedFeesDisplay = useMemo(() => {
    if (earnedFeesUsd === undefined) return '';
    return unitFormat(
      convertBigintToHumanReadable(earnedFeesUsd, USD_DECIMALS),
      usdAmountDisplayDecimal,
      {
        style: 'currency',
        currency: 'USD',
        showMinDecimalValue: true,
        signDisplay: earnedFeesUsd === 0n ? 'auto' : 'always',
        stripTrailingZeros: true,
      },
    );
  }, [earnedFeesUsd, usdAmountDisplayDecimal]);
  const coinIcon = mounted ? displayCoin?.icon : undefined;
  const coinSymbol = mounted
    ? displayCoin?.symbol
    : isVault
      ? undefined
      : USDT_NAME;

  return (
    <div className="grid grid-cols-1 gap-2">
      <h3 className="text-xs font-medium">
        <Trans>Your Holdings</Trans>
      </h3>
      <div className="grid grid-cols-2 text-xs">
        <div className="space-y-1">
          <div className="text-t-350">
            <Trans>Deposits</Trans>
          </div>
          <div className="flex items-center gap-1">
            {coinIcon && (
              <Image
                src={coinIcon}
                alt={coinSymbol ?? ''}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <SkeletonLayout isLoading={depositsLoading} className="h-5 w-18">
              <div className="text-base">{depositsDisplay}</div>
            </SkeletonLayout>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-t-350">
            <Trans>Earned Fees</Trans>
          </div>
          <SkeletonLayout isLoading={earnedFeesLoading} className="h-5 w-18">
            <div
              className={`text-base ${earnedFeesUsd !== undefined && earnedFeesUsd >= 0n ? 'text-up' : 'text-down'}`}
            >
              {earnedFeesDisplay}
            </div>
          </SkeletonLayout>
        </div>
      </div>
    </div>
  );
}
