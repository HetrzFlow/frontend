import { FC, useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import { Alert, AlertDescription } from '@repo/ui';
import {
  useMaxDepositWithdraw,
  usePoolDetail,
  getCachedPriceTickerData,
  useInstStore,
} from '@/common';
import {
  getCalcOpenPositionSizeParams,
  usePositionSizeAndFees,
} from '@/services/rest/trade';

interface AlertBannerProps {
  payCoinType?: string;
  payCoinSz?: string;
  collateralCoinType?: string;
}

const AlertBanner: FC<AlertBannerProps> = ({
  payCoinType,
  payCoinSz,
  collateralCoinType,
}) => {
  const coins = useInstStore((state) => state.getCoins());
  const { t } = useLingui();
  const [showAlert, setShowAlert] = useState(true);
  const calcParams = getCalcOpenPositionSizeParams();

  useEffect(() => {
    setShowAlert(true);
  }, [calcParams]);

  const { data: feeData } = usePositionSizeAndFees(
    payCoinType,
    collateralCoinType,
  );

  const [showPriceImpact, dispPriceImpactPercent] = useMemo(() => {
    const { collateral, priceImpact, swapFee } = feeData || {};
    if (collateral && priceImpact && swapFee) {
      const _priceImpactPercent = calc(priceImpact)
        .times(-1)
        .div(calc(collateral).plus(swapFee).plus(priceImpact));
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
  }, [feeData]);

  const { data: liqPoolData } = usePoolDetail();
  const { calculateSwapImpactOnWeightage } = useMaxDepositWithdraw();
  const [showBorrowImpact, dispBorrowImpact] = useMemo(() => {
    const { collateral } = feeData || {};
    const collateralCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === collateralCoinType,
    );
    const payCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === payCoinType,
    );
    const payCoinPx = getCachedPriceTickerData(
      payCoinType && coins[payCoinType]
        ? `${coins[payCoinType].symbol}/USD`
        : '',
    )?.[0]?.p;

    // need swap
    if (
      payCoinType !== collateralCoinType &&
      collateralCoinData &&
      payCoinData &&
      payCoinSz &&
      payCoinPx &&
      collateral
    ) {
      const { impact = 0, isHighImpact = false } =
        calculateSwapImpactOnWeightage({
          coinInCurrentWeight: payCoinData.current_weight,
          coinInTargetWeight: payCoinData.target_weight,
          coinOutCurrentWeight: collateralCoinData.current_weight,
          coinOutTargetWeight: collateralCoinData.target_weight,
          coinOutUsd: collateral,
          coinInUsd: calc(payCoinSz).times(payCoinPx).toFixed(),
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
    collateralCoinType,
    payCoinType,
    feeData,
    liqPoolData,
    payCoinSz,
    coins,
  ]);

  return (
    (showPriceImpact || showBorrowImpact) && (
      <Alert open={showAlert} onOpenChange={setShowAlert}>
        <AlertDescription>
          {showPriceImpact && (
            <span>{t`High Price Impact: ${dispPriceImpactPercent}`}</span>
          )}
          {showBorrowImpact && (
            <span>{t`High Swap Impact on Weightage: ${dispBorrowImpact}`}</span>
          )}
        </AlertDescription>
      </Alert>
    )
  );
};

export default AlertBanner;
