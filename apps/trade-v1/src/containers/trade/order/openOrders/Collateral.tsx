import { FC } from 'react';

import { calc } from '@repo/lib/calc';
import { usePriceTickerStream, useInstStore } from '@/common';
import CommonCollateral from '../components/Collateral';

interface CollateralProps {
  payCoin?: string;
  triggerPrice?: string;
  payCoinAmount?: string;
  collateralUsd?: string;
}

const Collateral: FC<CollateralProps> = ({
  payCoin,
  triggerPrice,
  payCoinAmount,
  collateralUsd,
}) => {
  const payCoinObj = useInstStore((state) => state.getCoins())[payCoin || ''];
  const payCoinPx = usePriceTickerStream(
    payCoinObj ? `${payCoinObj.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;

  return (
    <CommonCollateral
      collateral={
        collateralUsd ||
        calc(payCoinAmount || '')
          .div(payCoinObj ? Math.pow(10, payCoinObj.decimal) : '')
          .times(triggerPrice ? triggerPrice : (payCoinPx ?? ''))
          .toFixed()
      }
    />
  );
};

export default Collateral;
