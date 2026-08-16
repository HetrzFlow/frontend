import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useHzSdk,
  useInstStore,
  useMarketConfigs,
  useMarketValues,
} from '@/common';
import type { Order } from '@/common';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import { getEffectiveReferralDiscountUsd } from '@/lib/credit/creditReferral';
import { getCachedPriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import {
  calcNetPriceImpactUsdForDecrease,
  getPositionFeeRate,
} from '@/lib/trade/formulas';

import { useTpSlTablePosition } from '../context';
import { calcOrderEstimate } from './useEstimates';
import { getEffectiveSizeDeltaUsd } from './utils';

/**
 * Collects market inputs and fee components for TP/SL order estimates.
 * Keeps presentation components focused on rendering only.
 */
export function useOrderEstimate(order: Order) {
  const hzSdk = useHzSdk();
  const position = useTpSlTablePosition();
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[position.marketAddress || ''];
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;
  const isCreditMarket =
    position.isCreditMarket || inst?.category === CREDIT_MARKET_CATEGORY;
  const collateralToken = coins[position.collateralTokenAddress];
  const collateralTokenPx = getCachedPriceTickerExecutionPrice(
    getCreditAwareUsdPriceSymbol({
      isCreditMarket,
      tokenSymbol: collateralToken?.symbol,
    }),
    { isIncrease: false, isLong: position.isLong, priceType: 'min' },
  );
  const receiveTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress: position.collateralTokenAddress,
  });
  const receiveToken = isCreditMarket
    ? coins.USDT
    : coins[receiveTokenAddress || ''] || collateralToken;
  const receiveTokenPx = isCreditMarket
    ? getCachedPriceTickerExecutionPrice(
        getCreditAwareUsdPriceSymbol({
          isCreditMarket: false,
          tokenSymbol: receiveToken?.symbol,
        }),
        { isIncrease: false, isLong: position.isLong, priceType: 'min' },
      )
    : collateralTokenPx;

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();

  const sizeDeltaUsd = getEffectiveSizeDeltaUsd(order);
  const absSizeDeltaUsd = sizeDeltaUsd.abs();
  const priceImpact = calcNetPriceImpactUsdForDecrease({
    marketConfigs,
    marketValues,
    positionSizeInUsd: position.sizeInUsd,
    sizeDeltaUsd: absSizeDeltaUsd,
    pendingImpactAmount: position.pendingImpactAmount,
    indexTokenPrice: order.triggerPrice,
    indexTokenDecimals,
    isLong: position.isLong,
  });
  const feeRate = getPositionFeeRate({
    marketConfigs,
    balanceWasImproved: priceImpact.balanceWasImproved,
    isZFP: position.isZFP,
  });
  const closeFee = position.isZFP ? calc(0) : absSizeDeltaUsd.times(feeRate);
  const feeDiscountUsd = getEffectiveReferralDiscountUsd({
    isCreditMarket,
    feeUsd: closeFee.toFixed(),
    referralDiscountRate,
  });

  const borrowFee = calc(position.pendingBorrowingFeesUsd);
  const fundingFee = calc(position.fundingFeeAmount).times(
    collateralTokenPx || '0',
  );
  const fees = closeFee
    .plus(borrowFee)
    .plus(fundingFee)
    .minus(feeDiscountUsd)
    .minus(priceImpact.totalPriceImpactDeltaUsd);

  return {
    ...calcOrderEstimate({
      order,
      position,
      fees: fees.toFixed(),
      collateralTokenPx,
      isCreditMarket,
    }),
    collateralToken,
    collateralTokenPx,
    receiveToken,
    receiveTokenPx,
    isCreditMarket,
  };
}
