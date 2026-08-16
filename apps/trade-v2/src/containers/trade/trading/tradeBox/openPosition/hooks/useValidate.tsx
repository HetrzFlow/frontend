import { useMemo } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';
import {
  useBalances,
  balanceValidator,
  useInstStore,
  useOpenOrders,
  useGlobalStore,
  usePositions,
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_SYMBOL,
  getCreditAwareUsdPriceSymbol,
} from '@/common';
import { useAvailableLiquidity } from '@/common/hooks/useAvailableLiq';
import { usePositionConstants } from '@/common/services/rest/position';
import {
  slPxValidator,
  limitPriceValidator,
  tpPxValidator,
  residualCollateralValidator,
  minLeverageValidator,
  maxLeverageValidator,
} from '@/common/validators';
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
import { findFirstLimitIncreaseOrder } from '@/lib/trade/order';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { getActiveTpSlValue } from '../tpSlUtils';
import { useIsZFP } from './useIsZFP';
import type { PositionSizeAndFeesResultType } from '../../../store';

const getMinCollateralText = (minCollateralUnit: string) => {
  const dispMinCollateral = thoFormat(MIN_RESIDUAL_COLLATERAL);
  return i18n._(msg`Min Collateral: ${dispMinCollateral} ${minCollateralUnit}`);
};

export const useValidate = ({
  px,
  sz,
  coin,
  instId,
  isLong,
  shortInstName = '',
  payToken,
  feeData,
  tpPx,
  slPx,
  inputLeverage,
}: {
  px: string;
  sz: string;
  coin: string;
  instId: string;
  isLong: boolean;
  shortInstName?: string;
  payToken?: {
    symbol: string;
    decimals: number;
    decimal?: number;
    balance?: string;
  };
  feeData?:
    | PositionSizeAndFeesResultType
    | {
        openFee: number;
        size: string;
        collateralAmount: string;
        isPending: boolean;
      };
  tpPx?: string;
  slPx?: string;
  inputLeverage: string;
}) => {
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInst(state, instId), state.getCoins()]),
  );
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;
  const balances = useBalances();
  const maxProfitRate = useMaxProfitRate(inst);
  const { data: positionConstants } = usePositionConstants();
  const isZFP = useIsZFP();

  let preValidateText: string | undefined;

  preValidateText = useMemo(() => {
    // empty validation
    if (!+px) {
      return i18n._(msg`Enter a Price`);
    }
    if (!+sz) {
      return i18n._(msg`Enter an Amount`);
    }
    if (!coin || !feeData?.collateralAmount || !feeData.size) {
      return isLong
        ? i18n._(msg`Long ${shortInstName}`)
        : i18n._(msg`Short ${shortInstName}`);
    }
  }, [px, sz, coin, shortInstName, isLong, feeData]);

  const collateralTokenAddress =
    (isLong ? inst?.longTokenAddress : inst?.shortTokenAddress) ?? '';
  const {
    curEntryPx,
    nextEntryPx,
    nextSize,
    nextCollateralUsd,
    nextCloseFee,
    nextTotalPriceImpact,
    nextLiqPx,
    nextLeverage,
  } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: feeData?.size || '0',
    deltaCollateralAmount: feeData?.collateralAmount || '0',
    collateralTokenAddress: collateralTokenAddress || '',
    px,
    isZFP,
  });

  const hasPosition = !!curEntryPx;
  const activeTpPx = getActiveTpSlValue(tpPx);
  const activeSlPx = getActiveTpSlValue(slPx);

  const symbol = inst?.symbol ?? '';
  const markPx = usePriceTickerExecutionPrice({
    symbol,
    isIncrease: true,
    isLong,
    throttleWait: 5000,
  });
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // limit price validation
    if (px !== MARKET_PX) {
      const priceValidateResult = limitPriceValidator({
        isLong,
        px,
        symbol,
        markPx,
      });
      if (priceValidateResult) {
        return priceValidateResult;
      }
    }
  }, [preValidateText, symbol, isLong, px, markPx]);

  const { data: orders } = useOpenOrders();
  const firstLimitOrder = useMemo(
    () =>
      findFirstLimitIncreaseOrder({
        orders: orders || [],
        isLong,
        marketAddress: inst?.marketTokenAddress || '',
        isZFP,
      }),
    [orders, inst, isLong, isZFP],
  );

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // tpsl price validation
    const { message: priceValidateResult } = tpPxValidator({
      isLong,
      px: firstLimitOrder?.triggerPrice || MARKET_PX,
      symbol,
      hasPosition,
      tpPx: activeTpPx,
      nextEntryPx,
      nextSizeUsd: nextSize,
      nextCollateralUsd: nextCollateralUsd,
      allFeeUsd: nextCloseFee.minus(nextTotalPriceImpact).toFixed(),
      pxDispDecimal: inst?.pxDispDecimal,
      markPx,
      maxProfitRate,
    });
    if (priceValidateResult) {
      return priceValidateResult;
    }
  }, [
    inst,
    preValidateText,
    symbol,
    isLong,
    nextEntryPx,
    firstLimitOrder,
    nextSize,
    nextCollateralUsd,
    nextCloseFee,
    nextTotalPriceImpact,
    activeTpPx,
    hasPosition,
    markPx,
    maxProfitRate,
  ]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // tpsl price validation
    const { message: priceValidateResult } = slPxValidator({
      isLong,
      px: firstLimitOrder?.triggerPrice || MARKET_PX,
      symbol,
      hasPosition,
      slPx: activeSlPx,
      nextEntryPx,
      nextSizeUsd: nextSize,
      allFeeUsd: nextCloseFee.minus(nextTotalPriceImpact).toFixed(),
      nextCollateralUsd,
      pxDispDecimal: inst?.pxDispDecimal,
      markPx,
      liqPx: nextLiqPx,
      hyperSlLossCeil: isZFP ? HYPER_SL_LOSS_CEIL : undefined,
    });
    if (priceValidateResult) {
      return priceValidateResult;
    }
  }, [
    preValidateText,
    symbol,
    isLong,
    inst,
    nextEntryPx,
    nextSize,
    nextCollateralUsd,
    activeSlPx,
    hasPosition,
    firstLimitOrder,
    markPx,
    nextCloseFee,
    nextTotalPriceImpact,
    nextLiqPx,
    isZFP,
  ]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // coin balance validation
    const selectedCoin =
      coins[coin] ||
      (payToken
        ? {
            decimal: payToken.decimal ?? payToken.decimals,
            symbol: payToken.symbol,
          }
        : undefined);
    const payTokenDecimals = payToken?.decimal ?? payToken?.decimals;
    const payTokenRawBalance =
      payToken?.balance != null && payTokenDecimals != null
        ? calc(payToken.balance)
            .times(calc(10).pow(payTokenDecimals))
            .toFixed(0)
        : undefined;
    return balanceValidator({
      coin: selectedCoin,
      coinSize: sz,
      coinBalance: coins[coin]
        ? balances.find((v) => v.address === coin)?.totalBalance
        : payTokenRawBalance,
    });
  }, [preValidateText, balances, coin, coins, payToken, sz]);

  const collateralToken = coins[collateralTokenAddress];
  const displayToken = coins[coin] || payToken;
  const collateralTokenSymbol = isCreditMarket
    ? CREDIT_TOKEN_SYMBOL
    : (displayToken?.symbol ?? '');
  const collateralTokenPriceSymbol = getCreditAwareUsdPriceSymbol({
    isCreditMarket,
    tokenSymbol: collateralToken?.symbol,
  });
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;
    // min collateral validation
    if (feeData?.collateralAmount) {
      if (
        (isCreditMarket || displayToken?.symbol === 'USDT') &&
        calc(feeData.collateralAmount).lt(MIN_RESIDUAL_COLLATERAL - 0.01)
      ) {
        return getMinCollateralText(isCreditMarket ? 'Credit' : 'USDT');
      }
      if (!isCreditMarket && displayToken?.symbol !== 'USDT') {
        const collateralTokenPx = getCachedPriceTickerExecutionPrice(
          collateralTokenPriceSymbol,
          { isIncrease: true, isLong, priceType: 'min' },
        );
        if (
          collateralTokenPx &&
          calc(feeData.collateralAmount)
            .times(collateralTokenPx)
            .lt(MIN_RESIDUAL_COLLATERAL)
        ) {
          return getMinCollateralText('USD');
        }
      }
    }
  }, [
    preValidateText,
    feeData,
    isLong,
    isCreditMarket,
    displayToken,
    collateralTokenPriceSymbol,
  ]);

  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const maxLeverage = useMarketMaxLeverage(inst);
  const hyperLeverageRange = useHyperLeverageRange(inst);
  const finalMaxLeverage = isZFP ? hyperLeverageRange.max : maxLeverage;
  const finalMinLeverage = isZFP ? hyperLeverageRange.min : 1.1;
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;
    if (nextCollateralUsd) {
      const collateralTokenPx = getCachedPriceTickerExecutionPrice(
        collateralTokenPriceSymbol,
        { isIncrease: true, isLong, priceType: 'min' },
      );
      const residualCollateralError = residualCollateralValidator({
        nextCollateralUsd,
        collateralTokenSymbol: collateralTokenSymbol,
        collateralTokenPx,
        minResidualCollateral: MIN_RESIDUAL_COLLATERAL,
        isCreditMarket,
      });
      if (residualCollateralError) {
        return residualCollateralError;
      }

      if (!inputLeverage) {
        return i18n._(msg`Set a Leverage`);
      }

      const inputMinLeverageError = minLeverageValidator({
        nextLeverage: inputLeverage,
        finalMinLeverage,
        leverDecimal,
        isZFP,
      });
      if (inputMinLeverageError) {
        return inputMinLeverageError;
      }

      const minLeverageError = minLeverageValidator({
        nextLeverage,
        finalMinLeverage,
        leverDecimal,
        isZFP,
      });
      if (minLeverageError) {
        return minLeverageError;
      }

      const inputMaxLeverageError = maxLeverageValidator({
        nextLeverage: inputLeverage,
        finalMaxLeverage,
        leverDecimal,
      });
      if (inputMaxLeverageError) {
        return inputMaxLeverageError;
      }

      return maxLeverageValidator({
        nextLeverage,
        finalMaxLeverage,
        leverDecimal,
      });
    }
  }, [
    preValidateText,
    nextCollateralUsd,
    leverDecimal,
    finalMaxLeverage,
    finalMinLeverage,
    isLong,
    isZFP,
    collateralTokenSymbol,
    collateralTokenPriceSymbol,
    nextLeverage,
    inputLeverage,
    isCreditMarket,
  ]);

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const maxPositionSize = useTradeGlobalStore((state) => state.maxPositionSize);
  const { longAvailableLiquidity, shortAvailableLiquidity } =
    useAvailableLiquidity(inst?.marketTokenAddress);

  const { data: positions = [] } = usePositions();

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;
    // max position size validation
    if (feeData?.size) {
      const curPosSizeTotal = positions.reduce(
        (acc, pos) =>
          acc.plus(
            pos.marketAddress === inst?.marketTokenAddress &&
              pos.isLong === isLong &&
              pos.isZFP === isZFP
              ? pos.sizeInUsd
              : 0,
          ),
        calc(0),
      );
      const maxRemainingSize = calc(maxPositionSize).minus(curPosSizeTotal);
      const availableLiquidity = calc(
        (isLong ? longAvailableLiquidity : shortAvailableLiquidity) || Infinity,
      );
      const size = calc(feeData.size);
      const exceedsAvailableLiquidity = size.gt(availableLiquidity);
      const exceedsMaxPositionSize = size.gt(maxRemainingSize);

      if (exceedsAvailableLiquidity || exceedsMaxPositionSize) {
        const isAvailableLiquidityBottleneck =
          exceedsAvailableLiquidity &&
          (!exceedsMaxPositionSize || availableLiquidity.lte(maxRemainingSize));
        const bottleneckValue = isAvailableLiquidityBottleneck
          ? availableLiquidity
          : maxRemainingSize;
        const dispMaxValue = truncateFormat(
          calc.max(0, bottleneckValue),
          usdAmountDisplayDecimal,
        );
        if (isAvailableLiquidityBottleneck) {
          return i18n._(msg`Above Available Liquidity ${dispMaxValue} USD`);
        }
        return i18n._(msg`Above Max Position Size ${dispMaxValue} USD`);
      }
    }
  }, [
    feeData,
    inst,
    isLong,
    isZFP,
    longAvailableLiquidity,
    maxPositionSize,
    positions,
    preValidateText,
    shortAvailableLiquidity,
    usdAmountDisplayDecimal,
  ]);

  // Min position size validation for Hyper mode
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;
    if (!isZFP) return;
    if (!feeData?.size) return;

    const minZFPPositionSizeUsdRaw = positionConstants?.minZFPPositionSizeUsd;
    const minPositionSizeUsd = minZFPPositionSizeUsdRaw
      ? calc(minZFPPositionSizeUsdRaw.toString())
          .div(CONTRACT_USD_MULTIPLIER)
          .toNumber()
      : 0;

    if (minPositionSizeUsd <= 0) return;

    const curPosSizeTotal = positions.reduce(
      (acc, pos) =>
        acc.plus(
          pos.marketAddress === inst?.marketTokenAddress &&
            pos.isLong === isLong &&
            pos.isZFP === isZFP
            ? pos.sizeInUsd
            : 0,
        ),
      calc(0),
    );

    const totalPositionSize = curPosSizeTotal.plus(feeData.size);
    if (totalPositionSize.lt(minPositionSizeUsd)) {
      const minDelta = calc(minPositionSizeUsd)
        .minus(curPosSizeTotal)
        .toFixed();
      const dispMinValue = truncateFormat(
        calc.max(0, minDelta),
        usdAmountDisplayDecimal,
      );
      return i18n._(msg`Below Min Position Size ${dispMinValue} USD`);
    }
  }, [
    preValidateText,
    isZFP,
    feeData,
    positions,
    inst,
    isLong,
    usdAmountDisplayDecimal,
    positionConstants,
  ]);

  return preValidateText;
};
