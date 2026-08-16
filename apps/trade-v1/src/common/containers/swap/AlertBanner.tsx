import { FC, useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import { Alert, AlertDescription } from '@repo/ui';
import { useMaxDepositWithdraw } from '../../hooks/useMaxDepositInput';
import { usePoolDetail } from '../../services/rest/liqPool';
import {
  getCalcSwapAmountParams,
  useSwapFeeAmount,
} from '../../services/rest/swap';
import { getCachedPriceTickerData } from '../../services/ws/tickers';
import { useInstStore } from '../../stores/instStore';

interface AlertBannerProps {
  payCoinType?: string;
  receiveCoinType?: string;
}

const AlertBanner: FC<AlertBannerProps> = ({
  payCoinType,
  receiveCoinType,
}) => {
  const [showAlert, setShowAlert] = useState(true);
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());
  const calcParams = getCalcSwapAmountParams();

  const paySz = useWatch({ name: 'paySz' });
  const receiveSz = useWatch({ name: 'receiveSz' });

  const { coin: payCoin, value: paySzValue } = paySz;
  const { coin: receiveCoin, value: receiveSzValue } = receiveSz;

  useEffect(() => {
    setShowAlert(true);
  }, [calcParams]);

  const { data: feeData } = useSwapFeeAmount(payCoinType, receiveCoinType);

  const [showPriceImpact, dispPriceImpactPercent] = useMemo(() => {
    const { priceImpact, outAmount, swapFee } = feeData || {};
    const receiveCoinPx = getCachedPriceTickerData(
      `${coins[receiveCoin]?.symbol}/USD`,
    )?.[0]?.p;
    if (receiveCoinPx && outAmount && priceImpact && swapFee) {
      const _priceImpactPercent = calc(priceImpact)
        .times(-1)
        .div(
          calc(outAmount).times(receiveCoinPx).plus(priceImpact).plus(swapFee),
        );
      return [
        // threshold 20bps
        _priceImpactPercent.lt(-20 / 10000),
        percentFormat(_priceImpactPercent, 2, {
          stripTrailingZeros: true,
          signDisplay: 'always',
        }),
      ];
    } else {
      return [false, ''];
    }
  }, [feeData, coins, receiveCoin]);

  const { data: liqPoolData } = usePoolDetail();
  const { calculateSwapImpactOnWeightage } = useMaxDepositWithdraw();
  const [showSwapImpact, dispSwapImpact] = useMemo(() => {
    const payCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === payCoin,
    );
    const receiveCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === receiveCoin,
    );

    const payCoinPx = getCachedPriceTickerData(
      `${coins[payCoin]?.symbol}/USD`,
    )?.[0]?.p;
    const receiveCoinPx = getCachedPriceTickerData(
      `${coins[receiveCoin]?.symbol}/USD`,
    )?.[0]?.p;

    if (
      payCoinData?.current_weight &&
      payCoinData.target_weight &&
      receiveCoinData?.current_weight &&
      receiveCoinData.target_weight &&
      receiveCoinPx &&
      receiveSzValue &&
      payCoinPx &&
      paySzValue
    ) {
      const { impact = 0, isHighImpact = false } =
        calculateSwapImpactOnWeightage({
          coinInCurrentWeight: payCoinData.current_weight,
          coinInTargetWeight: payCoinData.target_weight,
          coinOutCurrentWeight: receiveCoinData.current_weight,
          coinOutTargetWeight: receiveCoinData.target_weight,
          coinOutUsd: calc(receiveSzValue).times(receiveCoinPx).toFixed(),
          coinInUsd: calc(paySzValue).times(payCoinPx).toFixed(),
        }) || {};

      return [
        isHighImpact,
        percentFormat(impact, 2, {
          stripTrailingZeros: true,
        }),
      ];
    }

    return [false, ''];
  }, [
    calculateSwapImpactOnWeightage,
    coins,
    liqPoolData,
    payCoin,
    paySzValue,
    receiveCoin,
    receiveSzValue,
  ]);

  return (
    (showPriceImpact || showSwapImpact) && (
      <Alert open={showAlert} onOpenChange={setShowAlert}>
        <AlertDescription>
          {showPriceImpact && (
            <span>{t`High Price Impact: ${dispPriceImpactPercent}`}</span>
          )}
          {showSwapImpact && (
            <span>{t`High Swap Impact on Weightage: ${dispSwapImpact}`}</span>
          )}
        </AlertDescription>
      </Alert>
    )
  );
};

export default AlertBanner;
