import { useMemo } from 'react';
import { calc, ZERO_STR } from '@hertzflow/sdk';
import { percentFormat } from '@repo/lib/format';
import { queryClient } from '@repo/lib/queryClient';
import {
  buildPriceId,
  useCoinWeights,
  useMaxDepositWithdraw,
  getCachedPriceTickerData,
  useInstStore,
} from '@/common';
import { HzlpTraderType } from '@/constants/hzlp/enum';
import { useTradeStore } from '@/stores/hzlp/trade';
import { convertToDisplayFee } from './useFeeContentData';

export const IMPACT_THRESHOLD = -0.0005;

export const useImpactAlertData = () => {
  const { getCoinWeightByCoinType } = useCoinWeights();
  const formData = useTradeStore((state) => state.formData);
  const tradeType = useTradeStore((state) => state.tradeType);
  const coins = useInstStore((state) => state.getCoins());
  const isBuy = useMemo(() => tradeType === HzlpTraderType.Buy, [tradeType]);
  const curFormData = isBuy
    ? formData[HzlpTraderType.Buy]
    : formData[HzlpTraderType.Sell];

  const { paySz, receiveSz } = curFormData;

  const amount = isBuy
    ? (paySz.value ?? ZERO_STR)
    : (receiveSz.value ?? ZERO_STR);

  const payCoin = useMemo(
    () => Object.values(coins).find((v) => v.symbol === paySz.coin),
    [coins, paySz.coin],
  );
  const receiveCoin = useMemo(
    () => Object.values(coins).find((v) => v.symbol === receiveSz.coin),
    [coins, receiveSz.coin],
  );

  const weightInfo = useMemo(() => {
    const targetCoinType = isBuy ? payCoin?.coinType : receiveCoin?.coinType;
    if (!targetCoinType) {
      return {
        currentWeight: 0,
        targetWeight: 0,
      };
    }

    const coinWeight = getCoinWeightByCoinType(targetCoinType);
    return {
      currentWeight: coinWeight?.currentWeight ?? 0,
      targetWeight: coinWeight?.targetWeight ?? 0,
    };
  }, [
    getCoinWeightByCoinType,
    isBuy,
    payCoin?.coinType,
    receiveCoin?.coinType,
  ]);

  const price = getCachedPriceTickerData(
    isBuy
      ? buildPriceId(payCoin?.symbol ?? '')
      : buildPriceId(receiveCoin?.symbol ?? ''),
  )?.[0]?.p;

  const operationUsd = useMemo(() => {
    return calc(amount)
      .times(price ?? 0)
      .toString(10);
  }, [amount, price]);

  const priceImpactSelectData = useMemo(() => {
    return queryClient.getQueryData([
      'priceImpactSelect',
      isBuy,
      isBuy ? payCoin?.coinType : receiveCoin?.coinType,
      isBuy ? receiveCoin?.coinType : payCoin?.coinType,
      amount,
    ]) as
      | {
          currentToken: {
            coinType: string;
            name: string;
            totalFee: string;
            lpFeeRate: string;
            priceImpactRate: string;
            priceImpact: string;
            lpFee: string;
          };
          bestToken: {
            coinType: string;
            name: string;
            totalFee: string;
            lpFeeRate: string;
            priceImpactRate: string;
            priceImpact: string;
            lpFee: string;
          };
          priceDifferencePercent: number;
        }
      | undefined;
  }, [isBuy, payCoin?.coinType, receiveCoin?.coinType, amount]);

  const priceImpactInfo = useMemo(() => {
    if (!priceImpactSelectData?.currentToken)
      return {
        isHightPriceImpact: false,
        displayPriceImpact: ZERO_STR,
      };

    const receiveAmount = receiveSz.value ?? ZERO_STR;

    if (!isBuy && (!receiveAmount || receiveAmount === ZERO_STR)) {
      return {
        isHightPriceImpact: false,
        displayPriceImpact: ZERO_STR,
      };
    }

    const priceImpactRate = priceImpactSelectData.currentToken.priceImpactRate;

    if (calc(priceImpactRate).lt(IMPACT_THRESHOLD)) {
      return {
        isHightPriceImpact: true,
        displayPriceImpact: percentFormat(
          convertToDisplayFee(priceImpactRate),
          2,
          {
            signDisplay: 'always',
          },
        ),
      };
    } else {
      return {
        isHightPriceImpact: false,
        displayPriceImpact: percentFormat(
          convertToDisplayFee(priceImpactRate),
          2,
          {
            signDisplay: 'always',
          },
        ),
      };
    }
  }, [priceImpactSelectData, isBuy, receiveSz.value]);

  const { calculateHzLPImpactOnWeightage } = useMaxDepositWithdraw();

  const { impact, isHighImpact: isHighImpactOnWeightage } =
    calculateHzLPImpactOnWeightage({
      tokenCurrentWeight: weightInfo.currentWeight,
      tokenTargetWeight: weightInfo.targetWeight,
      operationUsd,
      isBuy,
    });

  const displayPriceImpact = priceImpactInfo.displayPriceImpact;
  const displayImpactOnWeightage = percentFormat(
    convertToDisplayFee(impact),
    2,
    {
      signDisplay: 'always',
    },
  );

  return {
    isHighPriceImpact: priceImpactInfo.isHightPriceImpact,
    isHighImpactOnWeightage,
    displayPriceImpact,
    displayImpactOnWeightage,
  };
};
