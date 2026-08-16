import { FC, useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { calc } from '@repo/lib/calc';
import { Alert, AlertDescription } from '@repo/ui';

import { usePosition } from '../../context';
import {
  getCalcClosePositionSizeParams,
  useClosePosSizeAndFees,
} from './hooks/closePositionSizeAndFees';

interface AlertBannerProps {
  payCoinType?: string;
  collateralCoinType?: string;
}

const HIGH_PRICE_IMPACT_THRESHOLD = 99 / 100;

const AlertBanner: FC<AlertBannerProps> = () => {
  const [showAlert, setShowAlert] = useState(true);
  const { t } = useLingui();

  const receiveCoinType = useWatch({ name: 'receiveCoinType' });
  const calcParams = getCalcClosePositionSizeParams();
  const { collateralTokenAddress } = usePosition();

  useEffect(() => {
    setShowAlert(true);
  }, [calcParams]);

  const { data: feeData } = useClosePosSizeAndFees(
    collateralTokenAddress,
    receiveCoinType,
  );

  const showPriceImpact = useMemo(() => {
    const { rawPriceImpact, proratedCollateralUsd } = feeData || {};
    if (
      !rawPriceImpact ||
      !proratedCollateralUsd ||
      calc(rawPriceImpact).gte(0) ||
      calc(proratedCollateralUsd).lte(0)
    ) {
      return false;
    }
    const ratio = calc(rawPriceImpact).abs().div(proratedCollateralUsd);
    return ratio.gte(HIGH_PRICE_IMPACT_THRESHOLD);
  }, [feeData]);

  return (
    showPriceImpact && (
      <Alert open={showAlert} onOpenChange={setShowAlert}>
        <AlertDescription>
          {t`High price impact applied - may cause failed execution.`}
        </AlertDescription>
      </Alert>
    )
  );
};

export default AlertBanner;
