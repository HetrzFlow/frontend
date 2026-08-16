'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { formatAmountHuman } from '@hertzflow/sdk-v2/utils/numbers';
import { useMediaQuery, MEDIA_SIZES } from '@repo/ui';
import VaultTradeFeeRows from '@/common/components/VaultTradeFeeRows';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { useMarketInfoByAddress } from '@/queries/bsc/pools';
import { useVaultRemainingCaps } from '@/queries/bsc/vaults';
import { HZLP_NAME, HZV_NAME, LiqTradeType } from '@/stores/pools/trade';
import { POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS } from './constants';
import Slippage from './Slippage';

type PoolFeeContentProps = {
  direction: LiqTradeType;
  type: 'pool' | 'vault';
  marketAddress?: string;
  baseTokenName: string;
  displayDirectRate: number | null;
  displayReverseRate: number | null;
  isRateLoading: boolean;
  isRateUnavailable: boolean;
  onRateRefresh: () => void;
  rateRefreshTick: number;
  quoteFeeFactor?: bigint;
  inDialog?: boolean;
};

export default function PoolFeeContent({
  direction,
  type,
  marketAddress: marketAddressOverride,
  baseTokenName,
  displayDirectRate,
  displayReverseRate,
  isRateLoading,
  isRateUnavailable,
  onRateRefresh,
  rateRefreshTick,
  quoteFeeFactor,
  inDialog: inDialogOverride,
}: PoolFeeContentProps) {
  const tokenName = type === 'pool' ? HZLP_NAME : HZV_NAME;
  const params = useParams();
  const routeMarketAddress = params?.market_address as string | undefined;
  const marketAddress = marketAddressOverride ?? routeMarketAddress ?? '';
  const { data: marketInfo } = useMarketInfoByAddress(marketAddress ?? '', {
    enabled: type === 'pool' && !!marketAddress,
    refreshInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const {
    marketExposure: vaultMarketExposure,
    marketsInfoData: vaultMarketsInfo,
  } = useVaultRemainingCaps(type === 'vault' ? marketAddress : undefined);
  const feeFactor = useMemo(() => {
    if (type === 'pool') {
      return direction === LiqTradeType.Deposit
        ? marketInfo?.depositFeeFactorForBalanceWasNotImproved
        : marketInfo?.withdrawalFeeFactorForBalanceWasNotImproved;
    }
    if (!vaultMarketsInfo || !vaultMarketExposure?.length) {
      return undefined;
    }
    const factors = vaultMarketExposure.flatMap((item) => {
      if (!item.market_address) return [];
      const config = Object.entries(vaultMarketsInfo).find(
        ([address]) =>
          address.toLowerCase() === item.market_address!.toLowerCase(),
      )?.[1];
      const factor =
        direction === LiqTradeType.Deposit
          ? config?.depositFeeFactorForBalanceWasNotImproved
          : config?.withdrawalFeeFactorForBalanceWasNotImproved;
      return typeof factor === 'bigint' ? [factor] : [];
    });
    if (!factors.length) return undefined;
    return factors.reduce((max, value) => (value > max ? value : max));
  }, [
    direction,
    marketInfo?.depositFeeFactorForBalanceWasNotImproved,
    marketInfo?.withdrawalFeeFactorForBalanceWasNotImproved,
    type,
    vaultMarketExposure,
    vaultMarketsInfo,
  ]);

  // Format rates for display
  const directRateFormatted =
    displayDirectRate !== null ? displayDirectRate.toFixed(6) : null;
  const reverseRateFormatted =
    displayReverseRate !== null ? displayReverseRate.toFixed(6) : null;

  const displayedFeeFactor = quoteFeeFactor ?? feeFactor;
  const feePercent =
    displayedFeeFactor === undefined
      ? null
      : `${formatAmountHuman(displayedFeeFactor * 100n, 30, false, 2)}%`;

  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const inDialog = inDialogOverride ?? isMobile;

  return (
    <VaultTradeFeeRows
      direction={direction === LiqTradeType.Deposit ? 'deposit' : 'withdraw'}
      baseTokenName={baseTokenName}
      quoteTokenName={tokenName}
      directRate={directRateFormatted}
      reverseRate={reverseRateFormatted}
      isRateLoading={isRateLoading}
      isRateUnavailable={isRateUnavailable}
      onRateRefresh={onRateRefresh}
      rateRefreshKey={rateRefreshTick}
      rateRefreshDuration={POOL_TRADE_QUOTE_REFRESH_INTERVAL_MS / 1000}
      feeValue={feePercent === null ? undefined : `-${feePercent}`}
      slippageControl={<Slippage type="text" />}
      inDialog={inDialog}
      collisionBoundary={document.querySelector('.poolTradeContainer')}
    />
  );
}
