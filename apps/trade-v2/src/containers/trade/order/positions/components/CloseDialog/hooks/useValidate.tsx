import { useMemo } from 'react';
import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useWatch } from 'react-hook-form';

import { calc } from '@repo/lib/calc';

import { thoFormat } from '@repo/lib/format';
import {
  useInstStore,
  tpPxValidator,
  slPxValidator,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
  CONTRACT_USD_MULTIPLIER,
  CREDIT_TOKEN_SYMBOL,
  getCreditAwareUsdPriceSymbol,
  useGlobalStore,
  useHzSdk,
} from '@/common';
import {
  maxLeverageValidator,
  minLeverageValidator,
  residualCollateralValidator,
} from '@/common/validators';

import { ORDER_TYPE } from '@/constants/enum';
import {
  HYPER_SL_LOSS_CEIL,
  MARKET_PX,
  MIN_RESIDUAL_COLLATERAL,
} from '@/constants/trade';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import {
  useHyperLeverageRange,
  useMarketMaxLeverage,
  useMaxProfitRate,
} from '@/hooks/useMarketsStats';
import {
  getCachedPriceTickerExecutionPrice,
  usePriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';

import { usePreferenceStore } from '@/stores/trade/preference';
import { usePosition } from '../../../context';
import { useClosePosSizeAndFees } from './closePositionSizeAndFees';

export const useValidate = ({ orderType }: { orderType: ORDER_TYPE }) => {
  const hzSdk = useHzSdk();
  const position = usePosition();
  const {
    isLong,
    sizeInUsd: positionSize,
    collateralAmount,
    entryPrice,
    collateralTokenAddress,
    marketAddress,
  } = position;

  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[marketAddress];
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;
  const maxProfitRate = useMaxProfitRate(inst);
  const collateralToken = coins[collateralTokenAddress];
  const displayTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const displayToken = coins[displayTokenAddress || ''] || collateralToken;
  const collateralTokenSymbol = position.isCreditMarket
    ? CREDIT_TOKEN_SYMBOL
    : displayToken?.symbol;
  const collateralTokenPriceSymbol = getCreditAwareUsdPriceSymbol({
    isCreditMarket: position.isCreditMarket,
    tokenSymbol: collateralToken?.symbol,
  });
  const isZFP = position.isZFP;
  const keepLeverageFromStore = usePreferenceStore(
    (state) => state.keepLeverage,
  );
  const keepLeverage = isZFP ? true : keepLeverageFromStore;

  const size = useWatch({ name: 'size' });
  const px = useWatch({ name: 'px' });
  const receiveCoinType = useWatch({ name: 'receiveCoinType' });

  const indexTokenPx = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong,
    throttleWait: 5000,
  });
  const collateralTokenPx = usePriceTickerExecutionPrice({
    symbol: collateralTokenPriceSymbol,
    isIncrease: false,
    isLong,
    priceType: 'min',
    throttleWait: 5000,
  });

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();

  const isMarket = orderType === ORDER_TYPE.market;

  const isFullClose = calc(size || 0).gte(positionSize);

  // Get fee-adjusted position values, consistent with HelpfulInfo
  const {
    curCloseFee,
    curTotalPriceImpact,
    curBorrowFee,
    curFundingFee,
    curCollateralUsd,
    nextCollateralUsd,
    nextLeverage,
  } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: size ? calc(size).times(-1).toFixed() : '0',
    deltaCollateralAmount:
      keepLeverage || isFullClose
        ? calc(collateralAmount)
            .times(size || 0)
            .times(-1)
            .div(positionSize || 1)
            .toFixed()
        : '0',
    collateralTokenAddress,
    px,
    position,
  });

  let preValidateText: string | undefined;

  preValidateText = useMemo(() => {
    // no input in size
    if (!+size) {
      return i18n._(msg`Enter a Size`);
    }
  }, [size]);

  preValidateText = useMemo(() => {
    if (preValidateText || isMarket || !indexTokenPx) return preValidateText;

    if (!+px) {
      return i18n._(msg`Enter a Price`);
    }

    const allFeeUsd = calc(curCloseFee)
      .minus(curTotalPriceImpact)
      .plus(curFundingFee)
      .plus(curBorrowFee)
      .toFixed();

    const isGtMarkPx = calc(px).gt(indexTokenPx);

    // tpsl price validation
    const { message: priceValidateResult } =
      (isLong && isGtMarkPx) || (!isLong && !isGtMarkPx)
        ? tpPxValidator({
            isLong,
            px: MARKET_PX,
            symbol: inst?.symbol ?? '',
            hasPosition: true,
            tpPx: px,
            nextEntryPx: entryPrice,
            nextSizeUsd: positionSize,
            nextCollateralUsd: curCollateralUsd.toFixed(),
            allFeeUsd,
            pxDispDecimal: inst?.pxDispDecimal,
            markPx: indexTokenPx,
            maxProfitRate,
          })
        : slPxValidator({
            isLong,
            px: MARKET_PX,
            symbol: inst?.symbol ?? '',
            position,
            slPx: px,
            nextEntryPx: entryPrice,
            nextSizeUsd: positionSize,
            allFeeUsd,
            nextCollateralUsd: curCollateralUsd.toFixed(),
            pxDispDecimal: inst?.pxDispDecimal,
            markPx: indexTokenPx,
            collateralTokenPx,
            marketConfigs,
            marketValues,
            minCollateralUsd: positionConstants?.minCollateralUsd,
            indexTokenDecimals,
            hyperSlLossCeil: isZFP ? HYPER_SL_LOSS_CEIL : undefined,
          });
    if (priceValidateResult) {
      return priceValidateResult;
    }
  }, [
    preValidateText,
    curBorrowFee,
    curCloseFee,
    curFundingFee,
    curTotalPriceImpact,
    curCollateralUsd,
    inst,
    isLong,
    entryPrice,
    positionSize,
    px,
    isMarket,
    indexTokenPx,
    collateralTokenPx,
    marketConfigs,
    marketValues,
    maxProfitRate,
    indexTokenDecimals,
    position,
    positionConstants?.minCollateralUsd,
    isZFP,
  ]);
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // size gt positionSize
    if (calc(size).gt(positionSize)) {
      return i18n._(msg`Max close size exceeded`);
    }

    // hyper mode: remaining position size must be >= minZFPPositionSizeUsd
    if (isZFP && calc(size).lt(positionSize)) {
      const minZFPPositionSizeUsdRaw = positionConstants?.minZFPPositionSizeUsd;
      const minPositionSizeUsd = minZFPPositionSizeUsdRaw
        ? calc(minZFPPositionSizeUsdRaw.toString()).div(CONTRACT_USD_MULTIPLIER)
        : calc(0);

      if (
        minPositionSizeUsd.gt(0) &&
        calc(positionSize).minus(size).lt(minPositionSizeUsd)
      ) {
        const dispMinValue = thoFormat(minPositionSizeUsd.toNumber());
        return i18n._(
          msg`Remaining position size below minimum: ${dispMinValue} USD`,
        );
      }
    }
  }, [preValidateText, positionSize, size, isZFP, positionConstants]);

  const { data: closePosInfo } = useClosePosSizeAndFees(
    collateralTokenAddress,
    receiveCoinType || collateralTokenAddress,
  );

  const maxLeverage = useMarketMaxLeverage(inst);
  const hyperLeverageRange = useHyperLeverageRange(inst);
  const finalMaxLeverage = isZFP ? hyperLeverageRange.max : maxLeverage;

  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // residual collateral validation
    if (closePosInfo?.size && calc(closePosInfo?.size).lt(positionSize)) {
      const collateralTokenPx = getCachedPriceTickerExecutionPrice(
        collateralTokenPriceSymbol,
        { isIncrease: false, isLong, priceType: 'min' },
      );
      const residualCollateralError = residualCollateralValidator({
        nextCollateralUsd,
        collateralTokenSymbol,
        collateralTokenPx,
        minResidualCollateral: MIN_RESIDUAL_COLLATERAL,
        isCreditMarket: position.isCreditMarket,
      });
      if (residualCollateralError) {
        return residualCollateralError;
      }

      if (!keepLeverage && !isFullClose) {
        const minLeverageError = minLeverageValidator({
          nextLeverage,
          finalMinLeverage: 1.1,
          leverDecimal,
        });
        if (minLeverageError) {
          return minLeverageError;
        }
      }

      return maxLeverageValidator({
        nextLeverage,
        finalMaxLeverage,
        leverDecimal,
      });
    }
  }, [
    keepLeverage,
    isFullClose,
    preValidateText,
    collateralTokenPriceSymbol,
    collateralTokenSymbol,
    closePosInfo,
    positionSize,
    nextLeverage,
    nextCollateralUsd,
    finalMaxLeverage,
    isLong,
    leverDecimal,
    position.isCreditMarket,
  ]);

  return preValidateText;
};
