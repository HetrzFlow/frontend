import { FC } from 'react';
import { dateFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useGlobalStore } from '@/common/stores';

interface ItemProps {
  price: string;
  size: string;
  time: number;
  isBuy: boolean;
  pxDispDecimal?: number;
}

const Item: FC<ItemProps> = ({ price, size, time, isBuy, pxDispDecimal }) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  return (
    <div
      className={cn(
        'mt-1 flex cursor-pointer rounded-xl p-2 text-sm transition-[background]',
        isBuy ? 'hover:bg-up/10' : 'hover:bg-down/10',
      )}
    >
      <span className={cn('w-4/9', isBuy ? 'text-up' : 'text-down')}>
        {truncateFormat(price, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      </span>
      <span className="w-1/3">
        {unitFormat(size, usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      </span>
      <span className="text-t-350 w-2/9 text-right">
        {dateFormat(time, 'HH:mm:ss')}
      </span>
    </div>
  );
};

export default Item;
