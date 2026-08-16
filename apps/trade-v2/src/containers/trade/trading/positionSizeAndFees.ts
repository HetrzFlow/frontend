import { useCallback, useEffect, useMemo } from 'react';

import { calc } from '@repo/lib/calc';
import { toast } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useInstStore,
  useMarketsConfigs,
  useMarketsValues,
} from '@/common';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import {
  getEffectiveReferralDiscountRate,
  getEffectiveReferralDiscountUsd,
} from '@/lib/credit/creditReferral';
import { getCachedPriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import { calcPriceImpactUsd, getPositionFeeRate } from '@/lib/trade/formulas';
import {
  type CalcPositionSizeParamsType,
  DEFAULT_POSITION_SIZE_AND_FEES,
  getCalcOpenPositionSizeParams as getCalcOpenPositionSizeParamsFromStore,
  getOpenPositionSizeAndFees,
  getPositionSizeAndFeesStoreKey,
  useTradeStore,
} from './store';

const POSITION_SIZE_REFRESH_INTERVAL_MS = 2000;

let positionSizeRefreshIntervalId: number | null = null;
const positionSizeRefreshSubscribers = new Set<() => void>();

const subscribePositionSizeRefresh = (refresh: () => void) => {
  positionSizeRefreshSubscribers.add(refresh);

  if (!positionSizeRefreshIntervalId) {
    refresh();
    positionSizeRefreshIntervalId = window.setInterval(() => {
      positionSizeRefreshSubscribers.forEach((subscriber) => subscriber());
    }, POSITION_SIZE_REFRESH_INTERVAL_MS);
  }

  return () => {
    positionSizeRefreshSubscribers.delete(refresh);

    if (!positionSizeRefreshSubscribers.size && positionSizeRefreshIntervalId) {
      window.clearInterval(positionSizeRefreshIntervalId);
      positionSizeRefreshIntervalId = null;
    }
  };
};

export const useCalcPositionSize = () => {
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  // Cache reader: TradeBox registers the current instrument as active.
  const { data: marketsValues } = useMarketsValues(undefined, { markets: [] });
  // Cache reader: TradeBox registers the current instrument as active.
  const { data: marketsConfigs } = useMarketsConfigs({ markets: [] });
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();
  const setLatestParams = useTradeStore(
    (state) => state.setPositionSizeAndFeesParams,
  );
  const setResult = useTradeStore(
    (state) => state.setPositionSizeAndFeesResult,
  );
  const setPending = useTradeStore(
    (state) => state.setPositionSizeAndFeesPending,
  );

  const calcPositionSize = useCallback(
    async (params: CalcPositionSizeParamsType) => {
      setLatestParams(params);

      const {
        payCoinType,
        payCoinAmount,
        quotedCollateralAmount,
        collateralCoin,
        isLong,
        lever,
        marketAddress,
        position,
        isZFP,
      } = params;
      const storeKey = getPositionSizeAndFeesStoreKey({
        payCoinType,
        collateralCoinType: collateralCoin?.address,
        isZFP,
      });

      setPending(storeKey, true);

      try {
        const isCreditMarket =
          insts[marketAddress]?.category === CREDIT_MARKET_CATEGORY ||
          position?.isCreditMarket ||
          false;
        const collateralCoinPx = getCachedPriceTickerExecutionPrice(
          getCreditAwareUsdPriceSymbol({
            isCreditMarket,
            tokenSymbol: collateralCoin?.symbol,
          }),
          { isIncrease: true, isLong, priceType: 'min' },
        );
        const payCoinPx = getCachedPriceTickerExecutionPrice(
          getCreditAwareUsdPriceSymbol({
            isCreditMarket,
            tokenSymbol: params.payToken?.symbol || coins[payCoinType]?.symbol,
          }),
          { isIncrease: true, isLong, priceType: 'min' },
        );
        const effectivePayCoinPx = params.payCoinPx || payCoinPx;
        const payCoinDecimals =
          params.payToken?.decimal ??
          params.payToken?.decimals ??
          coins[payCoinType]?.decimal;
        if (
          payCoinDecimals != null &&
          (quotedCollateralAmount || effectivePayCoinPx) &&
          collateralCoinPx &&
          lever
        ) {
          const collateralUsd = quotedCollateralAmount
            ? calc(quotedCollateralAmount).times(collateralCoinPx)
            : payCoinAmount && effectivePayCoinPx
              ? calc(effectivePayCoinPx).times(payCoinAmount)
              : calc(0);
          const effectiveIsZFP = position?.isZFP ?? isZFP ?? false;
          const existingBorrowFee = position
            ? calc(position.pendingBorrowingFeesUsd)
            : calc(0);
          const existingFundingFee =
            position && collateralCoinPx
              ? calc(position.fundingFeeAmount).times(collateralCoinPx)
              : calc(0);

          const deltaSize = collateralUsd.times(lever);
          const marketValues = marketsValues?.[marketAddress];
          const marketConfigs = marketsConfigs?.[marketAddress];
          const effectiveReferralDiscountRate =
            getEffectiveReferralDiscountRate({
              isCreditMarket,
              referralDiscountRate,
            });
          const { priceImpactDeltaUsd, balanceWasImproved } =
            calcPriceImpactUsd({
              marketConfigs,
              marketValues,
              sizeInUsd: deltaSize,
              isLong,
              isIncrease: true,
            });
          const feeRate = getPositionFeeRate({
            marketConfigs,
            balanceWasImproved,
            isZFP: effectiveIsZFP,
          });
          const effectiveFeeRate = calc(feeRate.toString()).times(
            calc(1).minus(effectiveReferralDiscountRate),
          );
          // (collateral - size * openFeeRage - fund - borrow) * lever = size
          // size = (collateral - fund - borrow) / (1 / lever + openFeeRate)
          const deltaSizeAfterFee = calc.max(
            0,
            collateralUsd
              .minus(existingBorrowFee)
              .minus(existingFundingFee)
              .div(calc(1).div(lever).plus(effectiveFeeRate)),
          );
          const displayOpenFee = deltaSizeAfterFee.times(feeRate).toFixed();
          const displayFeeDiscountUsd = getEffectiveReferralDiscountUsd({
            isCreditMarket,
            feeUsd: displayOpenFee,
            referralDiscountRate,
          });
          const deltaCollateralUsd = collateralUsd
            .minus(existingBorrowFee)
            .minus(existingFundingFee)
            .minus(calc(displayOpenFee).minus(displayFeeDiscountUsd));

          const result = {
            displayOpenFee,
            displayFeeDiscountUsd,
            displayPriceImpact: calc(priceImpactDeltaUsd.toString()).toFixed(),
            displayDeltaCollateralUsd: deltaCollateralUsd.toFixed(),
            displaySizeDelta: deltaSizeAfterFee.toFixed(),
            displayAdjustedCollateralAmount: quotedCollateralAmount
              ? quotedCollateralAmount
              : collateralCoinPx
                ? calc(payCoinAmount || 0)
                    .times(effectivePayCoinPx)
                    .div(collateralCoinPx)
                    .toFixed()
                : payCoinAmount || '0',
          };

          if (params === getCalcOpenPositionSizeParamsFromStore()) {
            setResult(storeKey, {
              openFee: result.displayOpenFee,
              feeDiscountUsd: result.displayFeeDiscountUsd,
              priceImpact: result.displayPriceImpact,
              deltaCollateralUsd: result.displayDeltaCollateralUsd,
              size: result.displaySizeDelta,
              collateralAmount: result.displayAdjustedCollateralAmount,
              isPending: false,
            });
          }
          return result;
        }
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }

      setPending(storeKey, false);
    },
    [
      coins,
      insts,
      marketsConfigs,
      marketsValues,
      referralDiscountRate,
      setLatestParams,
      setPending,
      setResult,
    ],
  );

  return useMemo(
    () => ({
      mutate: (params: CalcPositionSizeParamsType) => {
        void calcPositionSize(params);
      },
      mutateAsync: calcPositionSize,
    }),
    [calcPositionSize],
  );
};

export const usePositionSizeAndFees = (
  payCoinType?: string,
  collateralCoinType?: string,
  isZFP?: boolean,
) => {
  const { mutate: calcPositionSize } = useCalcPositionSize();
  const storeKey = getPositionSizeAndFeesStoreKey({
    payCoinType,
    collateralCoinType,
    isZFP,
  });
  const data = useTradeStore(
    (state) =>
      state.positionSizeAndFeesResults[storeKey] ||
      DEFAULT_POSITION_SIZE_AND_FEES,
  );

  useEffect(() => {
    if (!(payCoinType && collateralCoinType)) {
      return;
    }

    return subscribePositionSizeRefresh(() => {
      const calcPositionSizeParams = getCalcOpenPositionSizeParamsFromStore();

      if (calcPositionSizeParams) {
        calcPositionSize(calcPositionSizeParams);
      }
    });
  }, [calcPositionSize, collateralCoinType, payCoinType, storeKey]);

  return { data };
};

export const getCalcOpenPositionSizeParams = () => {
  return getCalcOpenPositionSizeParamsFromStore();
};

export const getOpenPositionSizeFromCache = ({
  payCoinType,
  collateralCoinType,
  isZFP,
}: {
  payCoinType: string;
  collateralCoinType: string;
  isZFP?: boolean;
}) => {
  return getOpenPositionSizeAndFees({
    payCoinType,
    collateralCoinType,
    isZFP,
  });
};
