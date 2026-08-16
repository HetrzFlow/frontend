import { FC } from 'react';

import { calc, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useInstStore, usePriceTickerStream } from '@/common';

interface ExecutionDistanceProps {
  marketAddress: string;
  triggerPrice: string;
  isLong: boolean;
  isLimit: boolean;
  isTp: boolean;
  isSl: boolean;
}

const ExecutionDistance: FC<ExecutionDistanceProps> = ({
  marketAddress,
  triggerPrice,
  isLong,
  isLimit,
  isTp,
  isSl,
}) => {
  const inst = useInstStore((state) => state.getInsts()[marketAddress]);
  const markPrice = usePriceTickerStream(inst?.symbol, {
    throttleWait: 5000,
  }).data[0]?.p;

  const markPriceCalc = calc(markPrice || '');
  const triggerPriceCalc = calc(triggerPrice);

  if (
    !markPriceCalc.isFinite() ||
    markPriceCalc.lte(0) ||
    !triggerPriceCalc.isFinite()
  ) {
    return EMPTY_DISPLAY;
  }

  const usePositiveSign = (isLong && (isLimit || isSl)) || (!isLong && isTp);
  const executionDistance = markPriceCalc
    .minus(triggerPriceCalc)
    .div(markPriceCalc)
    .times(usePositiveSign ? 1 : -1);

  return (
    <span
      className={cn(
        'max-md:text-right max-md:text-sm',
        executionDistance.lt(0) && 'text-destructive',
      )}
    >
      {percentFormat(executionDistance, 2, {
        round: ROUND_MODE.ROUND,
      })}
    </span>
  );
};

export default ExecutionDistance;
