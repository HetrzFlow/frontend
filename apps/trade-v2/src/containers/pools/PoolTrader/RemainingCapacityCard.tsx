'use client';

import { memo, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import { cn, Skeleton } from '@repo/ui';
import { useGlobalStore, useInstStore } from '@/common';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { usePriceStore } from '@/common/stores/priceStore';
import { useMarketInfoByAddress } from '@/queries/bsc/pools';
import { LiqTradeType, usePoolsTradeStore } from '@/stores/pools/trade';
import {
  calculateMaxAumForDeposit,
  calculateRemainingDepositCap,
  calculateRemainingWithdrawalCap,
} from '@/stores/synthetics/marketsData/caps';
import { useVaultDepositCapMetrics } from '@/stores/synthetics/marketsData/selectors';
import { ActivityTabType } from '../PoolsDetail/components/ActivityPanel';

const formatUsdCapValue = (value: bigint | undefined, decimals: number) => {
  if (value === undefined) return undefined;
  return unitFormat(
    calc(value.toString(10)).div(calc(10).pow(USD_DECIMALS)).toString(),
    decimals,
    {
      style: 'currency',
      currency: 'USD',
      minNumber: 1000,
      showMinDecimalValue: true,
      stripTrailingZeros: true,
    },
  );
};

type RemainingCapacityViewProps = {
  direction: LiqTradeType;
  isLoading: boolean;
  usedUsdValue?: string;
  totalUsdValue?: string;
  remainingUsdValue?: string;
  usedPercent?: number;
};

const RemainingCapacityView = memo(function RemainingCapacityView({
  direction,
  isLoading,
  usedUsdValue,
  totalUsdValue,
  remainingUsdValue,
  usedPercent,
}: RemainingCapacityViewProps) {
  const { t } = useLingui();
  const isDeposit = direction === LiqTradeType.Deposit;
  const cappedUsedPercent =
    usedPercent === undefined
      ? undefined
      : Math.max(0, Math.min(100, usedPercent));
  const isFull = cappedUsedPercent !== undefined && cappedUsedPercent >= 100;
  const progressWidth =
    cappedUsedPercent === undefined ? undefined : `${cappedUsedPercent}%`;
  const remainingWidth =
    cappedUsedPercent === undefined ? '100%' : `calc(100% - ${progressWidth})`;
  const sliderLeft =
    cappedUsedPercent === undefined
      ? undefined
      : cappedUsedPercent <= 0
        ? '0'
        : cappedUsedPercent >= 100
          ? 'calc(100% - 2px)'
          : `calc(${progressWidth} - 1px)`;
  const percentText =
    cappedUsedPercent === undefined ? undefined : `${cappedUsedPercent}%`;
  const capText =
    usedUsdValue && totalUsdValue ? `${usedUsdValue} / ${totalUsdValue}` : '--';

  return (
    <div className="bg-bg-2 rounded-2xl p-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-t-270 text-xs">
            {isDeposit ? t`Deposited` : t`Withdrawn`}
          </div>
          <div className="text-t-1100 min-w-0 truncate text-right text-base font-medium">
            {isLoading ? (
              <Skeleton className="ml-auto h-[19.2px] w-28" />
            ) : (
              capText
            )}
          </div>
        </div>
        <div className="relative h-[11px]">
          <div
            className={cn(
              'to-warning absolute inset-x-0 top-0.5 h-1.5 overflow-hidden rounded-full bg-gradient-to-r',
              isDeposit ? 'from-up' : 'from-down',
            )}
          >
            <div
              className="bg-bg-4 absolute inset-y-0 right-0"
              style={{ width: remainingWidth }}
            />
          </div>
          {cappedUsedPercent !== undefined ? (
            <div
              className="absolute top-0 h-2.5 w-0.5 rounded-full bg-white"
              style={{ left: sliderLeft }}
            />
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="text-t-270">
            {isLoading ? (
              <Skeleton className="h-3.5 w-10" />
            ) : (
              (percentText ?? '--')
            )}
          </div>
          {isFull ? (
            <div className="text-warning">{t`Full`}</div>
          ) : (
            <div className="text-t-270">
              {isLoading ? (
                <Skeleton className="h-3.5 w-24" />
              ) : remainingUsdValue ? (
                t`${remainingUsdValue} remaining`
              ) : (
                '--'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function useRemainingCapacityData({
  type,
  direction,
}: {
  type: ActivityTabType;
  direction: LiqTradeType;
}) {
  const params = useParams();
  const marketAddress = params?.market_address as string | undefined;
  const isVault = type === ActivityTabType.VAULT;
  const isDeposit = direction === LiqTradeType.Deposit;
  const pricesMap = usePriceStore((state) => state.pricesMap);
  const usdtCoin = useInstStore((state) => state.getUsdtCoin(state));
  const usdtPrice = usdtCoin?.address
    ? pricesMap[usdtCoin.address]?.maxPrice
    : undefined;
  const usdtDecimals = usdtCoin?.decimals ?? 18;
  const { data: marketInfo, isLoading: isMarketInfoLoading } =
    useMarketInfoByAddress(marketAddress ?? '', {
      enabled: !isVault && !!marketAddress,
      refreshInterval: DYNAMIC_DATA_CACHE_TIME,
    });
  const {
    effectiveTotalCapUsd,
    depositedUsd,
    remainingDepositCapUsd: vaultRemainingDepositCapUsd,
    remainingWithdrawalCapUsd: vaultRemainingWithdrawalCapUsd,
    isRemainingCapsLoading,
  } = useVaultDepositCapMetrics(isVault ? marketAddress : undefined);

  const poolRemainingDepositCapUsd = useMemo(() => {
    if (isVault || !marketInfo) return undefined;
    return calculateRemainingDepositCap(
      marketInfo,
      usdtPrice,
      usdtDecimals,
      pricesMap,
    );
  }, [isVault, marketInfo, pricesMap, usdtDecimals, usdtPrice]);
  const poolDepositTotalCapUsd = useMemo(() => {
    if (isVault || !marketInfo) return undefined;
    return calculateMaxAumForDeposit(marketInfo, usdtPrice, usdtDecimals);
  }, [isVault, marketInfo, usdtDecimals, usdtPrice]);
  const poolRemainingWithdrawalCapUsd = useMemo(() => {
    if (isVault || !marketInfo) return undefined;
    if (Object.keys(pricesMap).length === 0) return undefined;
    return calculateRemainingWithdrawalCap(marketInfo, pricesMap);
  }, [isVault, marketInfo, pricesMap]);
  const poolWithdrawalTotalCapUsd = useMemo(() => {
    if (isVault || !marketInfo) return undefined;
    return marketInfo.withdrawalPoolValueMin ?? marketInfo.poolValueMin;
  }, [isVault, marketInfo]);

  if (isDeposit) {
    return {
      remainingCapacity: isVault
        ? vaultRemainingDepositCapUsd
        : poolRemainingDepositCapUsd,
      remainingCapacityTotal: isVault
        ? effectiveTotalCapUsd
        : poolDepositTotalCapUsd,
      isLoading: isVault ? isRemainingCapsLoading : isMarketInfoLoading,
    };
  }

  return {
    remainingCapacity: isVault
      ? vaultRemainingWithdrawalCapUsd
      : poolRemainingWithdrawalCapUsd,
    remainingCapacityTotal: isVault ? depositedUsd : poolWithdrawalTotalCapUsd,
    isLoading: isVault ? isRemainingCapsLoading : isMarketInfoLoading,
  };
}

function RemainingCapacityItem({
  type,
  direction,
}: {
  type: ActivityTabType;
  direction: LiqTradeType;
}) {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const { remainingCapacity, remainingCapacityTotal, isLoading } =
    useRemainingCapacityData({ type, direction });
  const usedCapacity = useMemo(() => {
    if (
      remainingCapacity === undefined ||
      remainingCapacityTotal === undefined
    ) {
      return undefined;
    }
    return remainingCapacityTotal > remainingCapacity
      ? remainingCapacityTotal - remainingCapacity
      : 0n;
  }, [remainingCapacity, remainingCapacityTotal]);
  const { remainingUsdValue, totalUsdValue, usedUsdValue } = useMemo(
    () => ({
      remainingUsdValue: formatUsdCapValue(
        remainingCapacity,
        usdAmountDisplayDecimal,
      ),
      totalUsdValue: formatUsdCapValue(
        remainingCapacityTotal,
        usdAmountDisplayDecimal,
      ),
      usedUsdValue: formatUsdCapValue(usedCapacity, usdAmountDisplayDecimal),
    }),
    [
      remainingCapacity,
      remainingCapacityTotal,
      usedCapacity,
      usdAmountDisplayDecimal,
    ],
  );
  const usedPercent = useMemo(() => {
    if (usedCapacity === undefined || remainingCapacityTotal === undefined) {
      return undefined;
    }
    if (remainingCapacityTotal <= 0n) return undefined;
    return Number((usedCapacity * 10000n) / remainingCapacityTotal) / 100;
  }, [remainingCapacityTotal, usedCapacity]);

  return (
    <RemainingCapacityView
      direction={direction}
      isLoading={isLoading}
      usedUsdValue={usedUsdValue}
      totalUsdValue={totalUsdValue}
      remainingUsdValue={remainingUsdValue}
      usedPercent={usedPercent}
    />
  );
}

export default function RemainingCapacityCard({
  type,
  directions,
}: {
  type: ActivityTabType;
  directions?: LiqTradeType[];
}) {
  const tradeDirection = usePoolsTradeStore((state) => state.tradeType);
  const visibleDirections = directions ?? [tradeDirection];

  return (
    <div className="space-y-2">
      {visibleDirections.map((direction) => (
        <RemainingCapacityItem
          key={direction}
          type={type}
          direction={direction}
        />
      ))}
    </div>
  );
}
