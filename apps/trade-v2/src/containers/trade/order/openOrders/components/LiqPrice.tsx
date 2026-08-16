import { FC } from 'react';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useInstStore } from '@/common';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';

interface LiqPriceProps {
  instId?: string;
  marketAddress?: string;
  isLong: boolean;
  isZFP?: boolean;
  sizeInUsd: string;
  triggerPrice: string;
  collateralAmount: string;
  collateralTokenAddress: string;
}

const LiqPrice: FC<LiqPriceProps> = ({
  instId,
  marketAddress,
  sizeInUsd,
  triggerPrice,
  collateralAmount,
  collateralTokenAddress,
  isLong,
  isZFP,
}) => {
  const instKey = instId || marketAddress || '';
  const inst = useInstStore((state) => state.getInsts()[instKey]);
  const pxDispDecimal = inst?.pxDispDecimal;

  const { nextLiqPx } = useCalcFinalPosition({
    inst,
    isLong,
    deltaSize: sizeInUsd,
    deltaCollateralAmount: collateralAmount,
    collateralTokenAddress: collateralTokenAddress,
    px: triggerPrice,
    isZFP,
  });

  return (
    <div>
      {truncateFormat(calc(nextLiqPx).lte(0) ? '' : nextLiqPx, pxDispDecimal, {
        style: 'currency',
        currency: 'USD',
      })}
    </div>
  );
};

export default LiqPrice;
