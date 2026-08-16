import { FC, useMemo } from 'react';

import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc, truncate } from '@repo/lib/calc';
import { CreditIcon } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_DISPLAY_DECIMALS,
  CREDIT_TOKEN_INPUT_DECIMALS,
  CREDIT_TOKEN_SYMBOL,
  getCreditAwareUsdPriceSymbol,
  useGlobalStore,
  useHzSdk,
  useInstStore,
} from '@/common';
import { useBalances } from '@/common/chainClient';
import { MIN_RESIDUAL_COLLATERAL } from '@/constants/trade';

import {
  useHyperLeverageRange,
  useMarketMaxLeverage,
} from '@/hooks/useMarketsStats';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import BasicSzInput from '../../../components/SzInput';
import { usePosition } from '../../context';
import { TYPE } from './enum';

const SzInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, value, onChange }) => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const {
    marketAddress,
    collateralAmount,
    collateralTokenAddress,
    sizeInUsd,
    pendingBorrowingFeesUsd,
    fundingFeeAmount,
    isLong,
    isZFP,
  } = usePosition();
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);
  const [coins, inst] = useInstStore(
    useShallow((state) => [state.getCoins(), state.getInsts()[marketAddress]]),
  );
  const type = useWatch({ name: 'type' });
  const isDeposit = type === TYPE.deposit;
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;
  const payTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const collateralCoin = coins[collateralTokenAddress];
  const payCoin = coins[payTokenAddress ?? collateralTokenAddress];
  const collateralTokenPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket,
      tokenSymbol: collateralCoin?.symbol,
    }),
    isIncrease: false,
    isLong,
    priceType: 'min',
  });

  const balances = useBalances();

  const balance = useMemo(() => {
    // not connect to wallet, display --
    if (!balances) return '';

    const balanceObj = balances.find(
      (v) => v.address === payTokenAddress,
    );
    // no balance, display 0
    if (!balanceObj || !balanceObj.totalBalance) return '0';

    return truncate(
      calc(balanceObj.totalBalance).div(
        Math.pow(10, payCoin?.decimal || 0),
      ),
      payCoin?.decimal,
    );
  }, [balances, payCoin, payTokenAddress]);

  const maxLeverage = useMarketMaxLeverage(inst);
  const hyperLeverageRange = useHyperLeverageRange(inst);
  const finalMaxLeverage = isZFP ? hyperLeverageRange.max : maxLeverage;

  const maxSize = useMemo(() => {
    if (isDeposit) {
      return balance;
    }
    const minResidualCollateralByLeverage =
      calc(sizeInUsd).div(finalMaxLeverage);
    const minResidualCollateralAmountByLeverage = collateralTokenPx
      ? calc(minResidualCollateralByLeverage).div(collateralTokenPx)
      : 0;

    // handle usdt
    const minResidualCollateralAmountConst =
      isCreditMarket || collateralCoin?.symbol === 'USDT'
        ? MIN_RESIDUAL_COLLATERAL
        : collateralTokenPx
          ? calc(MIN_RESIDUAL_COLLATERAL).div(collateralTokenPx)
          : 0;
    const minResidualCollateralAmount = calc(
      minResidualCollateralAmountByLeverage,
    ).gt(minResidualCollateralAmountConst)
      ? minResidualCollateralAmountByLeverage
      : minResidualCollateralAmountConst;
    const borrowFee = pendingBorrowingFeesUsd;
    const fundingFee = calc(fundingFeeAmount).times(collateralTokenPx || '');
    const fees = calc(borrowFee).plus(fundingFee);
    const feesAmount = collateralTokenPx
      ? calc(fees).div(collateralTokenPx)
      : 0;
    const positiveFeesAmount = calc.max(0, feesAmount);
    const maxWithdrawableCollateral = calc(collateralAmount)
      .minus(minResidualCollateralAmount)
      .minus(positiveFeesAmount);

    return truncate(calc.max(0, maxWithdrawableCollateral), usdAmountDecimal);
  }, [
    isDeposit,
    balance,
    collateralTokenPx,
    collateralAmount,
    sizeInUsd,
    finalMaxLeverage,
    usdAmountDecimal,
    fundingFeeAmount,
    pendingBorrowingFeesUsd,
    collateralCoin,
    isCreditMarket,
  ]);

  return (
    <BasicSzInput
      value={value}
      label={isDeposit ? t`Deposit` : t`Withdraw`}
      onChange={onChange}
      className={className}
      numberInputClassName="bg-bg-4"
      maxSize={maxSize}
      max={isDeposit ? balance : maxSize}
      coin={payCoin}
      inst={inst}
      priceSymbol={
        isCreditMarket
          ? getCreditAwareUsdPriceSymbol({
              isCreditMarket,
              tokenSymbol: collateralCoin?.symbol,
            })
          : undefined
      }
      displaySymbol={isCreditMarket ? CREDIT_TOKEN_SYMBOL : undefined}
      displayIcon={
        isCreditMarket ? (
          <CreditIcon size={32} className="text-accent" />
        ) : undefined
      }
      decimal={isCreditMarket ? CREDIT_TOKEN_INPUT_DECIMALS : undefined}
      dispDecimal={isCreditMarket ? CREDIT_TOKEN_DISPLAY_DECIMALS : undefined}
      inputSzIsCoin
    />
  );
};

export default SzInput;
