import { useMemo } from 'react';
import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';

import {
  balanceValidator,
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_SYMBOL,
  getCreditAwareUsdPriceSymbol,
  useGlobalStore,
  useHzSdk,
  useInstStore,
} from '@/common';
import { useBalances } from '@/common/chainClient';
import {
  maxLeverageValidator,
  minLeverageValidator,
  residualCollateralValidator,
} from '@/common/validators';
import { MARKET_PX, MIN_RESIDUAL_COLLATERAL } from '@/constants/trade';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import {
  useHyperLeverageRange,
  useMarketMaxLeverage,
} from '@/hooks/useMarketsStats';
import {
  getCachedPriceTickerExecutionPrice,
  usePriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import { usePosition } from '../../../context';
import { TYPE } from '../enum';

export const useValidate = () => {
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const hzSdk = useHzSdk();
  const position = usePosition();
  const isZFP = position.isZFP;
  const {
    isLong,
    collateralTokenAddress,
    sizeInUsd: curSize,
    marketAddress,
  } = position;
  const [coins, insts] = useInstStore(
    useShallow((state) => [state.getCoins(), state.getInsts()]),
  );
  const inst = insts[marketAddress];
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;
  const payTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const collateralCoin = coins[collateralTokenAddress];
  const payCoin = coins[payTokenAddress ?? collateralTokenAddress];
  const collateralTokenSymbol = isCreditMarket
    ? CREDIT_TOKEN_SYMBOL
    : payCoin?.symbol;
  const collateralTokenPriceSymbol = getCreditAwareUsdPriceSymbol({
    isCreditMarket,
    tokenSymbol: collateralCoin?.symbol,
  });
  const balances = useBalances();

  const type = useWatch({ name: 'type' });
  const size = useWatch({ name: 'size' });

  const isDeposit = type === TYPE.deposit;

  const { nextCollateralUsd, nextLiqPx } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: '0',
    deltaCollateralAmount: isDeposit ? size : calc(size).times(-1).toFixed(),
    collateralTokenAddress,
    px: MARKET_PX,
    position,
  });

  let preValidateText: string | undefined;

  preValidateText = useMemo(() => {
    // empty validation
    if (!+size) {
      return i18n._(msg`Enter an Amount`);
    }
  }, [size]);

  const maxLeverage = useMarketMaxLeverage(inst);
  const hyperLeverageRange = useHyperLeverageRange(inst);
  const finalMaxLeverage = isZFP ? hyperLeverageRange.max : maxLeverage;
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;
    // withdraw validations
    if (nextCollateralUsd) {
      const collateralTokenPx = getCachedPriceTickerExecutionPrice(
        collateralTokenPriceSymbol,
        { isIncrease: false, isLong, priceType: 'min' },
      );
      return (
        residualCollateralValidator({
          nextCollateralUsd,
          collateralTokenSymbol,
          collateralTokenPx,
          minResidualCollateral: MIN_RESIDUAL_COLLATERAL,
          isCreditMarket,
        }) ||
        maxLeverageValidator({
          nextCollateralUsd,
          nextSizeUsd: curSize,
          finalMaxLeverage,
          leverDecimal,
        })
      );
    }
  }, [
    preValidateText,
    curSize,
    nextCollateralUsd,
    collateralTokenSymbol,
    collateralTokenPriceSymbol,
    finalMaxLeverage,
    isLong,
    leverDecimal,
    isCreditMarket,
  ]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    if (isDeposit) {
      // coin balance validation
      return balanceValidator({
        coin: payCoin,
        coinSize: size,
        coinBalance: balances.find((v) => v.address === payTokenAddress)
          ?.totalBalance,
      });
    }
  }, [
    preValidateText,
    isDeposit,
    payCoin,
    payTokenAddress,
    size,
    balances,
  ]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // deposit validations
    if (isDeposit) {
      return minLeverageValidator({
        nextCollateralUsd,
        nextSizeUsd: curSize,
        finalMinLeverage: isZFP ? hyperLeverageRange.min : 1.1,
        leverDecimal,
        isZFP,
      });
    }
  }, [
    preValidateText,
    isDeposit,
    curSize,
    nextCollateralUsd,
    isZFP,
    hyperLeverageRange.min,
    leverDecimal,
  ]);

  const last = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong,
    throttleWait: 5000,
  });
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // withdraw liqpx validations
    if (!isDeposit && nextLiqPx && last) {
      if (
        (isLong && calc(nextLiqPx).gt(last)) ||
        (!isLong && calc(nextLiqPx).lt(last))
      ) {
        return i18n._(msg`Invalid Liq Price`);
      }
    }
  }, [preValidateText, isDeposit, nextLiqPx, last, isLong]);

  return preValidateText;
};
