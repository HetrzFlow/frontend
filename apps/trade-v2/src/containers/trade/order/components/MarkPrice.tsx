import { FC } from 'react';

import { truncateFormat } from '@repo/lib/format';
import { usePriceTickerStream, useInstStore } from '@/common';

interface MarkPriceProps {
  instId?: string;
  marketAddress?: string;
}

const MarkPrice: FC<MarkPriceProps> = ({ instId, marketAddress }) => {
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId || marketAddress || ''];
  const pxDispDecimal = inst?.pxDispDecimal;

  const { data } = usePriceTickerStream(inst?.symbol);

  return (
    <div className="font-plex leading-tight max-md:text-sm">
      {truncateFormat(data[0]?.p, pxDispDecimal, {
        style: 'currency',
        currency: 'USD',
      })}
    </div>
  );
};

export default MarkPrice;
