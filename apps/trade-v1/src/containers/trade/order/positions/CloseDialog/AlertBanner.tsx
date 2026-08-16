import { FC, useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import { Alert, AlertDescription } from '@repo/ui';
import { getCachedPriceTickerData, useInstStore } from '@/common';
import { MARKET_PX } from '@/constants/common';
import {
  getCalcClosePositionSizeParams,
  useClosePosSizeAndFees,
} from '@/services/rest/trade';
import { usePosition } from '../context';

interface AlertBannerProps {
  payCoinType?: string;
  collateralCoinType?: string;
}

const AlertBanner: FC<AlertBannerProps> = () => {
  const [showAlert, setShowAlert] = useState(true);
  const { t } = useLingui();

  const coins = useInstStore((state) => state.getCoins());
  const px = useWatch({ name: 'px' });
  const receiveCoinType = useWatch({ name: 'receiveCoinType' });
  const calcParams = getCalcClosePositionSizeParams();
  const { isLong, collateralCoin } = usePosition();

  useEffect(() => {
    setShowAlert(true);
  }, [calcParams]);

  const { data: feeData } = useClosePosSizeAndFees(
    collateralCoin,
    receiveCoinType,
  );

  const receiveCoin = coins[receiveCoinType];

  const [priceImpactPercent, dispPriceImpactPercent] = useMemo(() => {
    const { receiveCoinAmount, priceImpact, swapFee } = feeData || {};
    const receiveCoinPx =
      (!isLong || px === MARKET_PX ? '' : px) ||
      getCachedPriceTickerData(`${receiveCoin?.symbol}/USD`)?.[0]?.p;

    if (receiveCoinAmount && receiveCoinPx && priceImpact && swapFee) {
      const _priceImpactPercent = calc(priceImpact)
        .times(-1)
        .div(
          calc(receiveCoinPx)
            .times(receiveCoinAmount)
            .plus(swapFee)
            .plus(priceImpact),
        );
      return [
        _priceImpactPercent,
        percentFormat(_priceImpactPercent, 2, {
          stripTrailingZeros: true,
          signDisplay: 'always',
        }),
      ];
    } else {
      return [undefined, ''];
    }
  }, [feeData, px, isLong, receiveCoin]);

  // threshold 20bps
  const showPriceImpact =
    priceImpactPercent && priceImpactPercent.lt(-20 / 10000);

  return (
    showPriceImpact && (
      <Alert open={showAlert} onOpenChange={setShowAlert}>
        <AlertDescription>
          {showPriceImpact && t`High Price Impact: ${dispPriceImpactPercent}`}
        </AlertDescription>
      </Alert>
    )
  );
};

export default AlertBanner;
