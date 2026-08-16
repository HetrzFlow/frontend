import { useEffect, useMemo } from 'react';
import { ZERO_STR } from '@hertzflow/sdk';
import { UseFormReturn } from 'react-hook-form';
import { calc } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import { useHzLPDetail, useGlobalStore, useInstStore } from '@/common';
import { HzlpTraderType } from '@/constants/hzlp/enum';
import {
  useHzLPReceiveAmount,
  usePriceImpactSelect,
} from '@/services/rest/hzlp/trade';
import { FormDataType, useTradeStore } from '@/stores/hzlp/trade';

export const convertToDisplayFee = (fee: string) => {
  return calc(fee).times(-1).toString(10);
};

interface UseFeeContentDataParams {
  form: UseFormReturn<FormDataType>;
  handlePaySzChange: (value: { value: string; coin: string }) => void;
}

export const useFeeContentData = ({
  form,
  handlePaySzChange,
}: UseFeeContentDataParams) => {
  const { data: hzLPDetail } = useHzLPDetail();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const coins = useInstStore((state) => state.getCoins());
  const tradeType = useTradeStore((state) => state.tradeType);
  const formData = useTradeStore((state) => state.formData);
  const isBuy = tradeType === HzlpTraderType.Buy;
  const curFormData = isBuy
    ? formData[HzlpTraderType.Buy]
    : formData[HzlpTraderType.Sell];

  const { paySz, receiveSz } = curFormData;

  const payCoin = useMemo(
    () => Object.values(coins).find((v) => v.symbol === paySz.coin),
    [coins, paySz.coin],
  );
  const receiveCoin = useMemo(
    () => Object.values(coins).find((v) => v.symbol === receiveSz.coin),
    [coins, receiveSz.coin],
  );

  const { isReady, currentToken, bestToken, priceDifferencePercent, setData } =
    usePriceImpactSelect({
      isBuy,
      payCoinType: payCoin?.coinType ?? '',
      receiveCoinType: receiveCoin?.coinType ?? '',
      payCoinAmount: paySz.value ?? ZERO_STR,
    });

  useEffect(() => {
    if (isReady) {
      setData({
        currentToken,
        bestToken,
        priceDifferencePercent,
      });
    }
  }, [isReady, currentToken, bestToken, priceDifferencePercent, setData]);

  const pxUnit = isBuy
    ? [payCoin?.symbol, hzLPDetail?.symbol]
    : [hzLPDetail?.symbol, receiveCoin?.symbol];

  const { data: isFetching, refetch } = useHzLPReceiveAmount(
    isBuy,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form as any,
    handlePaySzChange,
  );

  const handleSwitchToOptimalToken = () => {
    if (!bestToken) return;
    if (isBuy) {
      const currentAmount = parseFloat(paySz.value ?? ZERO_STR);
      if (currentAmount > 0) {
        if (currentToken.price && bestToken.price) {
          const currentUsdValue = calc(currentAmount).times(currentToken.price);
          const equivalentAmount = currentUsdValue.div(bestToken.price);
          handlePaySzChange({
            value: equivalentAmount.toString(),
            coin: bestToken.symbol,
          });
        } else {
          handlePaySzChange({
            value: '',
            coin: bestToken.symbol,
          });
        }
      } else {
        handlePaySzChange({
          value: '',
          coin: bestToken.symbol,
        });
      }
    } else {
      form.setValue('receiveSz', {
        value: form.getValues('receiveSz.value') || '',
        coin: bestToken.symbol,
      });
    }
  };

  const formattedPriceImpact = useMemo(
    () =>
      percentFormat(convertToDisplayFee(currentToken.priceImpactRate), 2, {
        showMinDecimalValue: true,
        stripTrailingZeros: true,
        signDisplay: 'exceptZero',
      }),
    [currentToken.priceImpactRate],
  );

  const formattedLpFee = useMemo(
    () =>
      percentFormat(
        convertToDisplayFee(currentToken.lpFeeRate ?? ZERO_STR),
        2,
        {
          showMinDecimalValue: true,
          stripTrailingZeros: true,
          signDisplay: 'exceptZero',
        },
      ),
    [currentToken.lpFeeRate],
  );

  const formattedPriceImpactUSD = useMemo(
    () =>
      unitFormat(
        convertToDisplayFee(currentToken.priceImpact),
        usdAmountDisplayDecimal,
        {
          style: 'currency',
          currency: 'USD',
          stripTrailingZeros: true,
          showMinDecimalValue: true,
          signDisplay: 'always',
        },
      ),
    [currentToken.priceImpact, usdAmountDisplayDecimal],
  );

  const formattedLpFeeUSD = useMemo(
    () =>
      unitFormat(
        convertToDisplayFee(currentToken.lpFee),
        usdAmountDisplayDecimal,
        {
          style: 'currency',
          currency: 'USD',
          stripTrailingZeros: true,
          showMinDecimalValue: true,
          signDisplay: 'always',
        },
      ),
    [currentToken.lpFee, usdAmountDisplayDecimal],
  );

  return {
    isBuy,
    paySz,
    receiveSz,
    pxUnit,
    isFetching,
    isReady,
    currentToken,
    bestToken,
    priceDifferencePercent,
    formattedPriceImpact,
    formattedLpFee,
    formattedPriceImpactUSD,
    formattedLpFeeUSD,
    refetch,
    handleSwitchToOptimalToken,
  };
};
