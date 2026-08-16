import { useMemo } from 'react';
import { ZERO_STR } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import {
  MIN_REMAINING_SUI,
  HZLP_CONSTANTS,
  buildPriceId,
  MIN_HZLP_ORDER_USD,
  useCoinWeights,
  useMaxDepositWithdraw,
  useHzLPDetail,
  useHZLPPrice,
  usePriceTickerStream,
  useInstStore,
  balanceValidator,
} from '@/common';
import { NORMALIZED_SUI_TYPE_ARG } from '@/constants/common';
import { useBalances } from '@/hooks/useAccount';
import { useWeightThresholds, useMinOrderCheck } from './useHzlpCheck';

export interface FormValidationResult {
  isValid: boolean;
  errorMessage: string;
  isInputDisabled: boolean;
  buttonText: string;
  isCalculating?: boolean;
}

export const useFormValidation = (
  isBuy: boolean,
  paySzValue: string,
  payCoin: string,
  receiveCoin?: string,
  isPercentageFill: boolean = false,
  percentageValue: number = 0,
  isCalculating: boolean = false,
) => {
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoinsArr());
  const coinsObj = useInstStore((state) => state.getCoins());
  const { getCoinWeightByCoinType } = useCoinWeights();
  const { data: hzlpDetail } = useHzLPDetail();

  const payCoinObj = coins.find((v) => v.symbol === payCoin);
  const receiveCoinObj = coins.find((v) => v.symbol === receiveCoin);

  const balances = useBalances([
    (isBuy ? payCoinObj?.coinType : hzlpDetail?.coin_type) || '',
    NORMALIZED_SUI_TYPE_ARG,
  ]);

  // get coin price when buy
  const payCoinPrice = usePriceTickerStream(isBuy ? buildPriceId(payCoin) : '')
    .data[0]?.p;
  // get hzlp price when sell
  const hzlpPrice = useHZLPPrice(!isBuy);
  const tokenPrice = isBuy ? payCoinPrice : hzlpPrice;

  const { calculateMaxDepositInput, calculateMaxWithdrawal } =
    useMaxDepositWithdraw();

  const currentCoinWeight = useMemo(() => {
    if (isBuy && payCoinObj) {
      return getCoinWeightByCoinType(payCoinObj.coinType);
    }

    if (!isBuy && receiveCoinObj) {
      return getCoinWeightByCoinType(receiveCoinObj.coinType);
    }
    return null;
  }, [getCoinWeightByCoinType, payCoinObj, receiveCoinObj, isBuy]);

  const weightThresholds = useWeightThresholds(
    currentCoinWeight?.currentWeight || 0,
    currentCoinWeight?.targetWeight || 0,
  );

  const minOrderCheck = useMinOrderCheck(paySzValue, tokenPrice);

  const maxLimits = useMemo(() => {
    if (!currentCoinWeight || !tokenPrice) return null;

    if (isBuy) {
      return calculateMaxDepositInput({
        currentWeight: currentCoinWeight.currentWeight,
        targetWeight: currentCoinWeight.targetWeight,
        tokenPrice: tokenPrice,
      });
    } else {
      return calculateMaxWithdrawal({
        currentWeight: currentCoinWeight.currentWeight,
        targetWeight: currentCoinWeight.targetWeight,
        tokenPrice: tokenPrice,
      });
    }
  }, [
    currentCoinWeight,
    tokenPrice,
    isBuy,
    calculateMaxDepositInput,
    calculateMaxWithdrawal,
  ]);

  const walletBalance = useMemo(() => {
    if (
      !isBuy &&
      (payCoin === HZLP_CONSTANTS.SYMBOL ||
        payCoin === HZLP_CONSTANTS.SYMBOL_UPPERCASE)
    ) {
      if (!balances?.[0]?.totalBalance || !hzlpDetail) return ZERO_STR;

      const balance = calc(balances[0].totalBalance).div(
        Math.pow(10, hzlpDetail.hzlp_decimal || 0),
      );

      return balance.toString(10);
    }

    if (!balances?.[0]?.totalBalance || !payCoinObj) return ZERO_STR;
    const balance = calc(balances[0].totalBalance).div(
      Math.pow(10, payCoinObj.decimal || 0),
    );

    if (payCoinObj.coinType === NORMALIZED_SUI_TYPE_ARG) {
      return calc.max(calc(0), balance.minus(MIN_REMAINING_SUI)).toString(10);
    }

    return balance.toString(10);
  }, [balances, payCoinObj, isBuy, payCoin, hzlpDetail]);

  const actualInputAmount = useMemo(() => {
    if (!isPercentageFill) {
      return paySzValue;
    }

    const percentDecimal = calc(percentageValue).div(100);
    const baseAmount = calc(walletBalance).times(percentDecimal);

    if (isBuy && payCoinObj?.coinType === NORMALIZED_SUI_TYPE_ARG) {
      return calc
        .max(calc(0), baseAmount.minus(MIN_REMAINING_SUI))
        .toString(10);
    }

    return baseAmount.toString(10);
  }, [
    isPercentageFill,
    percentageValue,
    walletBalance,
    paySzValue,
    isBuy,
    payCoinObj,
  ]);

  const validation = useMemo((): FormValidationResult => {
    if (!balances) {
      return {
        isValid: false,
        errorMessage: '',
        isInputDisabled: false,
        buttonText: t`Connect Wallet`,
        isCalculating: false,
      };
    }

    if (isBuy && !weightThresholds.canDeposit) {
      return {
        isValid: false,
        errorMessage: t`Max Target Weightage Limit Exceeded`,
        isInputDisabled: true,
        buttonText: t`Max Target Weightage Limit Exceeded`,
        isCalculating: false,
      };
    }

    if (!isBuy && !weightThresholds.canWithdraw) {
      return {
        isValid: false,
        errorMessage: t`Below Min Target Weightage Limit`,
        isInputDisabled: true,
        buttonText: t`Below Min Target Weightage Limit`,
        isCalculating: false,
      };
    }

    if (!actualInputAmount || calc(actualInputAmount).lte(0)) {
      return {
        isValid: false,
        errorMessage: '',
        isInputDisabled: false,
        buttonText: t`Enter an amount`,
        isCalculating: false,
      };
    }

    if (isCalculating && actualInputAmount && calc(actualInputAmount).gt(0)) {
      return {
        isValid: false,
        errorMessage: '',
        isInputDisabled: true,
        buttonText: t`Finalizing Quote`,
        isCalculating: true,
      };
    }

    if (!minOrderCheck.isValid) {
      return {
        isValid: false,
        errorMessage: t`Min Order: ${MIN_HZLP_ORDER_USD} USD`,
        isInputDisabled: false,
        buttonText: t`Min Order: ${MIN_HZLP_ORDER_USD} USD`,
        isCalculating: false,
      };
    }

    const _text = balanceValidator({
      coin: isBuy
        ? payCoinObj
        : hzlpDetail
          ? {
              coinType: hzlpDetail.coin_type,
              symbol: hzlpDetail.symbol,
              decimal: hzlpDetail.hzlp_decimal,
            }
          : undefined,
      coinSize: actualInputAmount,
      coinBalance: balances?.[0]?.totalBalance,
      suiCoin: coinsObj[NORMALIZED_SUI_TYPE_ARG],
      suiBalance: balances?.[1]?.totalBalance,
    });
    if (_text) {
      return {
        isValid: false,
        errorMessage: _text,
        isInputDisabled: false,
        buttonText: _text,
        isCalculating: false,
      };
    }

    if (maxLimits && calc(actualInputAmount).gt(maxLimits.coinAmount)) {
      const maxAmount = truncateFormat(
        maxLimits.coinAmount,
        payCoinObj?.decimal,
      );
      return {
        isValid: false,
        errorMessage: t`Exceeds Max Input ${maxAmount}`,
        isInputDisabled: false,
        buttonText: t`Exceeds Max Input ${maxAmount}`,
        isCalculating: false,
      };
    }

    return {
      isValid: true,
      errorMessage: '',
      isInputDisabled: false,
      buttonText: isBuy ? t`Buy HzLP` : t`Sell HzLP`,
      isCalculating: false,
    };
  }, [
    balances,
    isBuy,
    weightThresholds,
    actualInputAmount,
    minOrderCheck,
    maxLimits,
    payCoinObj,
    hzlpDetail,
    coinsObj,
    isCalculating,
    t,
  ]);

  return {
    ...validation,
    actualInputAmount,
    maxLimits,
    weightThresholds,
    minOrderCheck,
    walletBalance,
  };
};
