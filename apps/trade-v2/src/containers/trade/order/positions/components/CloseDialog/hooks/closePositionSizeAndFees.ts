import { useCallback, useEffect, useMemo } from 'react';

import { calc } from '@repo/lib/calc';
import { toast } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  getCachedPriceTickerData,
  useInstStore,
  useMarketsConfigs,
  useMarketsValues,
} from '@/common';
import { MARKET_PX } from '@/constants/trade';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import {
  getCreditMarketReceiveUsd,
  getLossRebateAdjustedPnl,
} from '@/lib/credit/creditDisplay';
import { getEffectiveReferralDiscountUsd } from '@/lib/credit/creditReferral';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import {
  calcNetPriceImpactUsdForDecrease,
  getPositionFeeRate,
} from '@/lib/trade/formulas';
import {
  type CalcClosePosParamsType,
  DEFAULT_CLOSE_POS_SIZE_AND_FEES,
  getCalcClosePositionSizeParams as getCalcClosePositionSizeParamsFromStore,
  getClosePositionSizeAndFees,
  getClosePosSizeAndFeesStoreKey,
  usePositionsStore,
} from '../../../store';

const CLOSE_POSITION_REFRESH_INTERVAL_MS = 3000;

let closePositionRefreshIntervalId: number | null = null;
const closePositionRefreshSubscribers = new Set<() => void>();

const subscribeClosePositionRefresh = (refresh: () => void) => {
  closePositionRefreshSubscribers.add(refresh);

  if (!closePositionRefreshIntervalId) {
    refresh();
    closePositionRefreshIntervalId = window.setInterval(() => {
      closePositionRefreshSubscribers.forEach((subscriber) => subscriber());
    }, CLOSE_POSITION_REFRESH_INTERVAL_MS);
  }

  return () => {
    closePositionRefreshSubscribers.delete(refresh);

    if (
      !closePositionRefreshSubscribers.size &&
      closePositionRefreshIntervalId
    ) {
      window.clearInterval(closePositionRefreshIntervalId);
      closePositionRefreshIntervalId = null;
    }
  };
};

export const useCalcClosePosition = () => {
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  // Cache reader: CloseDialog registers the submitted position market.
  const { data: marketsValues } = useMarketsValues(undefined, { markets: [] });
  // Cache reader: the owning close dialog registers its position market.
  const { data: marketsConfigs } = useMarketsConfigs({ markets: [] });
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();
  const setLatestParams = usePositionsStore(
    (state) => state.setClosePosSizeAndFeesParams,
  );
  const setResult = usePositionsStore(
    (state) => state.setClosePosSizeAndFeesResult,
  );
  const setPending = usePositionsStore(
    (state) => state.setClosePosSizeAndFeesPending,
  );

  const calcClosePosition = useCallback(
    async (params: CalcClosePosParamsType) => {
      setLatestParams(params);

      let { sizeDelta } = params;
      sizeDelta = sizeDelta || '0';
      const {
        position,
        collateralCoin,
        receiveCoin,
        triggerPrice,
        keepLeverage,
      } = params;
      const storeKey = getClosePosSizeAndFeesStoreKey({
        collateralCoinType: collateralCoin?.address,
        receiveCoinType: receiveCoin?.address,
      });

      setPending(storeKey, true);

      try {
        const {
          sizeInUsd,
          collateralAmount,
          isLong,
          entryPrice,
          pendingBorrowingFeesUsd,
          fundingFeeAmount,
          marketAddress,
          pendingLossRebateUsd,
          pendingImpactAmount,
        } = position;
        const inst = insts[marketAddress];
        const indexTokenPx =
          getCachedMarketExecutionPrice({
            symbol: inst?.symbol,
            indexTokenAddress: inst?.indexTokenAddress,
            isIncrease: false,
            isLong,
          }) || getCachedPriceTickerData(inst?.symbol)?.[0]?.p;
        const closePx =
          triggerPrice === MARKET_PX ? indexTokenPx : triggerPrice;
        const isCreditMarket =
          insts[marketAddress]?.category === CREDIT_MARKET_CATEGORY ||
          position.isCreditMarket;
        const collateralTokenPx = getCachedPriceTickerExecutionPrice(
          getCreditAwareUsdPriceSymbol({
            isCreditMarket,
            tokenSymbol: collateralCoin?.symbol,
          }),
          { isIncrease: false, isLong, priceType: 'min' },
        );

        if (
          collateralCoin &&
          closePx &&
          collateralTokenPx &&
          receiveCoin?.decimal &&
          coins[collateralCoin?.address || '']?.decimal
        ) {
          const deltaCollateralAmount =
            keepLeverage || calc(sizeDelta).gte(sizeInUsd)
              ? calc(collateralAmount)
                  .times(sizeDelta || 0)
                  .div(sizeInUsd)
              : '0';
          const proratedCollateralUsd = calc(collateralAmount)
            .times(collateralTokenPx)
            .times(sizeDelta || 0)
            .div(sizeInUsd);

          const marketValues = marketsValues?.[marketAddress];
          const marketConfigs = marketsConfigs?.[marketAddress];

          const {
            totalPriceImpactDeltaUsd,
            rawTotalPriceImpactDeltaUsd,
            balanceWasImproved,
          } = calcNetPriceImpactUsdForDecrease({
            marketConfigs,
            marketValues,
            positionSizeInUsd: sizeInUsd,
            sizeDeltaUsd: sizeDelta,
            pendingImpactAmount,
            indexTokenPrice: closePx,
            indexTokenDecimals: inst?.indexTokenAddress
              ? coins[inst.indexTokenAddress]?.decimals
              : undefined,
            isLong,
          });

          const feeRate = getPositionFeeRate({
            marketConfigs,
            balanceWasImproved,
            isZFP: position.isZFP,
          });
          const closeFee = position.isZFP
            ? calc(0)
            : calc(sizeDelta).times(feeRate);
          const feeDiscountUsd = getEffectiveReferralDiscountUsd({
            isCreditMarket: !!isCreditMarket,
            feeUsd: closeFee.toFixed(),
            referralDiscountRate,
          });

          const borrowFee = pendingBorrowingFeesUsd;
          const fundingFee = calc(fundingFeeAmount).times(
            collateralTokenPx || '',
          );
          const uPnl = calc(sizeDelta).times(
            calc(closePx)
              .minus(entryPrice)
              .div(entryPrice)
              .times(isLong ? 1 : -1),
          );
          const adjustedUPnl = calc(
            getLossRebateAdjustedPnl({
              uPnl: uPnl.toFixed(),
              pendingLossRebateUsd,
              collateralDeltaAmount: deltaCollateralAmount.toString(),
              collateralAmount,
              isCreditMarket: !!isCreditMarket,
            }),
          );
          const priceImpact = totalPriceImpactDeltaUsd;
          const payForCost = calc(borrowFee)
            .plus(fundingFee)
            .plus(closeFee)
            .minus(feeDiscountUsd)
            .minus(priceImpact)
            .minus(adjustedUPnl);

          const finalDeltaCollateralAmount = calc
            .max(
              0,
              calc(deltaCollateralAmount)
                .times(collateralTokenPx)
                .minus(calc.max(payForCost, 0)),
            )
            .div(collateralTokenPx)
            .toFixed();

          const receiveAmount = isCreditMarket
            ? calc(
                getCreditMarketReceiveUsd({
                  pnlPortionUsd: adjustedUPnl.toFixed(),
                  feesUsd: calc(borrowFee)
                    .plus(fundingFee)
                    .plus(closeFee)
                    .minus(priceImpact)
                    .toFixed(),
                }),
              ).div(collateralTokenPx)
            : collateralTokenPx
              ? calc(finalDeltaCollateralAmount)
                  .times(collateralTokenPx)
                  .minus(calc.min(payForCost, 0))
                  .div(collateralTokenPx)
              : calc(0);

          const result = {
            displayCloseFee: closeFee.toFixed(),
            displayFeeDiscountUsd: feeDiscountUsd,
            displayPriceImpact: priceImpact.toFixed(),
            displayRawPriceImpact: rawTotalPriceImpactDeltaUsd.toFixed(),
            displayProratedCollateralUsd: proratedCollateralUsd.toFixed(),
            displaySizeDelta: sizeDelta,
            displayCollateralAmountDelta: deltaCollateralAmount.toString(),
            displayReceiverCoinAmount: receiveAmount.lt(0)
              ? '0'
              : receiveAmount.toFixed(),
            finalDeltaCollateralAmount,
          };

          if (params === getCalcClosePositionSizeParamsFromStore()) {
            setResult(storeKey, {
              closeFee: result.displayCloseFee,
              feeDiscountUsd: result.displayFeeDiscountUsd,
              priceImpact: result.displayPriceImpact,
              rawPriceImpact: result.displayRawPriceImpact,
              proratedCollateralUsd: result.displayProratedCollateralUsd,
              size: result.displaySizeDelta,
              collateralAmount: result.displayCollateralAmountDelta,
              fundingFee: 0,
              receiveCoinAmount: result.displayReceiverCoinAmount,
              closePx: closePx.toString(),
              collateralTokenPx: collateralTokenPx.toString(),
              isPending: false,
              finalDeltaCollateralAmount: result.finalDeltaCollateralAmount,
            });
            return result;
          }
          return;
        }

        setResult(storeKey, {
          closeFee: 0,
          feeDiscountUsd: 0,
          priceImpact: 0,
          rawPriceImpact: 0,
          proratedCollateralUsd: '0',
          size: '',
          collateralAmount: '',
          fundingFee: 0,
          receiveCoinAmount: '',
          closePx: '',
          collateralTokenPx: '',
          finalDeltaCollateralAmount: '',
          isPending: false,
        });
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
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
      mutate: (params: CalcClosePosParamsType) => {
        void calcClosePosition(params);
      },
      mutateAsync: calcClosePosition,
    }),
    [calcClosePosition],
  );
};

export const useClosePosSizeAndFees = (
  collateralCoinType?: string,
  receiveCoinType?: string,
) => {
  const { mutate: calcClosePos } = useCalcClosePosition();
  const storeKey = getClosePosSizeAndFeesStoreKey({
    collateralCoinType,
    receiveCoinType,
  });
  const data = usePositionsStore(
    (state) =>
      state.closePosSizeAndFeesResults[storeKey] ||
      DEFAULT_CLOSE_POS_SIZE_AND_FEES,
  );

  useEffect(() => {
    if (!(receiveCoinType && collateralCoinType)) {
      return;
    }

    return subscribeClosePositionRefresh(() => {
      const calcClosePosSizeParams = getCalcClosePositionSizeParamsFromStore();

      if (calcClosePosSizeParams) {
        calcClosePos(calcClosePosSizeParams);
      }
    });
  }, [calcClosePos, collateralCoinType, receiveCoinType, storeKey]);

  return { data };
};

export const getCalcClosePositionSizeParams = () => {
  return getCalcClosePositionSizeParamsFromStore();
};

export const getClosePositionSizeFromCache = ({
  receiveCoinType,
  collateralCoinType,
}: {
  receiveCoinType: string;
  collateralCoinType: string;
}) => {
  return getClosePositionSizeAndFees({
    collateralCoinType,
    receiveCoinType,
  });
};
