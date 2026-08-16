import { FC } from 'react';

import { truncateFormat } from '@repo/lib/format';
import { usePriceTickerStream, useInstStore } from '@/common';

interface MarkPriceProps {
  targetCoin: string;
}

const MarkPrice: FC<MarkPriceProps> = ({ targetCoin }) => {
  const inst = useInstStore((state) =>
    state.getInstsArr().find((v) => v.coinType === targetCoin),
  );
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;

  const { data } = usePriceTickerStream(inst?.id);

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
