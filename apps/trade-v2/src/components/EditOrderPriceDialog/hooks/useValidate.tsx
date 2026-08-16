import { useMemo } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';

import {
  getCachedPriceTickerData,
  useInstStore,
  limitPriceValidator,
  tpPxValidator,
  slPxValidator,
  type Position,
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
} from '@/common';

import { HYPER_SL_LOSS_CEIL, MARKET_PX } from '@/constants/trade';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import { calcPositionFees } from '@/lib/trade/formulas';
import { useOrder, useSizeEditCtx } from '../context';

export const useValidate = ({ position }: { position?: Position }) => {
  const {
    isLong,
    marketAddress,
    isOpen,
    isLimit,
    initialCollateralTokenAddress,
    isTp,
    isSl,
  } = useOrder();
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[marketAddress];
  const maxProfitRate = useMaxProfitRate(inst);
  const collateralToken = coins[initialCollateralTokenAddress];
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;

  const symbol = inst?.symbol ?? '';
  const { sizeEditable } = useSizeEditCtx();

  const px = useWatch({ name: 'px' });
  const size = useWatch({ name: 'size' });

  let preValidateText: string | undefined;

  // Size validation for sizeEditable
  preValidateText = useMemo(() => {
    if (!sizeEditable) return undefined;
    if (!size || !+size) {
      return i18n._(msg`Enter close size`);
    }
    if (calc(size).lte(0)) {
      return i18n._(msg`Close size must be greater than 0`);
    }
  }, [sizeEditable, size]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;
    // empty validation
    if (!+px) {
      return i18n._(msg`Enter a Price`);
    }
  }, [preValidateText, px]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    const markPx = getCachedPriceTickerData(symbol)?.[0]?.p;
    // price validation
    // limit price validation
    if (markPx) {
      if (
        ((isLong && isOpen) || (!isLong && isTp) || (isLong && isSl)) &&
        calc(px).gt(markPx)
      ) {
        return i18n._(msg`Price too high`);
      }
      if (
        ((!isLong && isOpen) || (isLong && isTp) || (!isLong && isSl)) &&
        calc(px).lt(markPx)
      ) {
        return i18n._(msg`Price too low`);
      }
    }
  }, [preValidateText, symbol, isLong, isOpen, isTp, isSl, px]);

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    const markPx = getCachedPriceTickerData(symbol)?.[0]?.p;
    let message;

    if (isLimit) {
      message = limitPriceValidator({
        isLong,
        px: px,
        symbol,
        markPx: markPx,
      });
    }

    const collateralTokenPx = getCachedPriceTickerData(
      getCreditAwareUsdPriceSymbol({
        isCreditMarket: inst?.category === CREDIT_MARKET_CATEGORY,
        tokenSymbol: collateralToken?.symbol,
      }),
    )?.[0]?.p;

    let allFeeUsd = '0';
    if (position) {
      const { borrowFee, fundingFee, totalPriceImpact, closeFee } =
        calcPositionFees({
          position,
          collateralTokenPx,
          indexTokenPx: markPx,
          indexTokenDecimals,
          marketConfigs,
          marketValues,
          isZFP: position?.isZFP,
        });
      allFeeUsd = calc(borrowFee)
        .plus(fundingFee)
        .plus(closeFee)
        .minus(totalPriceImpact)
        .toFixed();
    }

    if (isTp) {
      const result = tpPxValidator({
        tpPx: px,
        symbol,
        px: MARKET_PX,
        pxDispDecimal: inst?.pxDispDecimal,
        isLong,
        hasPosition: !!position,
        nextSizeUsd: position?.sizeInUsd,
        nextCollateralUsd:
          position?.collateralAmount && collateralTokenPx
            ? calc(position?.collateralAmount)
                .times(collateralTokenPx)
                .toFixed()
            : '',
        allFeeUsd,
        nextEntryPx: position?.entryPrice,
        displayPosition: 'btn',
        markPx,
        maxProfitRate,
      });
      message = result.message;
    }
    if (isSl) {
      const result = slPxValidator({
        slPx: px,
        symbol,
        px: MARKET_PX,
        pxDispDecimal: inst?.pxDispDecimal,
        isLong,
        position,
        nextSizeUsd: position?.sizeInUsd,
        nextCollateralUsd:
          position?.collateralAmount && collateralTokenPx
            ? calc(position?.collateralAmount)
                .times(collateralTokenPx)
                .toFixed()
            : '',
        allFeeUsd,
        nextEntryPx: position?.entryPrice,
        displayPosition: 'btn',
        markPx,
        collateralTokenPx,
        marketConfigs,
        marketValues,
        minCollateralUsd: positionConstants?.minCollateralUsd,
        indexTokenDecimals,
        hyperSlLossCeil: position?.isZFP ? HYPER_SL_LOSS_CEIL : undefined,
      });

      message = result.message;
    }

    return message;
  }, [
    preValidateText,
    px,
    inst,
    symbol,
    position,
    isLimit,
    isTp,
    isSl,
    isLong,
    collateralToken,
    maxProfitRate,
    indexTokenDecimals,
    marketConfigs,
    marketValues,
    positionConstants?.minCollateralUsd,
  ]);

  return preValidateText;
};
