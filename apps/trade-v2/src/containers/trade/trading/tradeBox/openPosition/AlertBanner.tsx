import { FC, useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { Alert, AlertDescription } from '@repo/ui';

import {
  getCalcOpenPositionSizeParams,
  usePositionSizeAndFees,
} from '../../positionSizeAndFees';
import { useIsZFP } from './hooks/useIsZFP';

interface AlertBannerProps {
  payCoinType?: string;
  payCoinSz?: string;
  collateralCoinType?: string;
}

const HIGH_PRICE_IMPACT_THRESHOLD = -25 / 100;

const AlertBanner: FC<AlertBannerProps> = ({
  payCoinType,
  collateralCoinType,
}) => {
  const { t } = useLingui();
  const [showAlert, setShowAlert] = useState(true);
  const calcParams = getCalcOpenPositionSizeParams();
  const isZFP = useIsZFP();

  useEffect(() => {
    setShowAlert(true);
  }, [calcParams]);

  const { data: feeData } = usePositionSizeAndFees(
    payCoinType,
    collateralCoinType,
    isZFP,
  );

  const showPriceImpact = useMemo(() => {
    const { priceImpact, deltaCollateralUsd } = feeData || {};
    if (
      !priceImpact ||
      !deltaCollateralUsd ||
      calc(deltaCollateralUsd).lte(0)
    ) {
      return false;
    }
    const ratio = calc(priceImpact).div(deltaCollateralUsd);
    return ratio.lt(HIGH_PRICE_IMPACT_THRESHOLD);
  }, [feeData]);

  return (
    showPriceImpact && (
      <Alert open={showAlert} onOpenChange={setShowAlert}>
        <AlertDescription>
          {t`High price impact stored - settled upon position decrease.`}
        </AlertDescription>
      </Alert>
    )
  );
};

export default AlertBanner;
