import { MouseEvent } from 'react';
import { calc } from '@repo/lib/calc';
import { truncateFormat, unitFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useGlobalStore } from '@/common/stores';
import { PlatformHistoryOrder } from '@/services/rest/order';
import Time from './Time';
import type { RowComponentProps } from 'react-window';

interface ItemProps {
  data: PlatformHistoryOrder[];
  pxDispDecimal?: number;
  onMouseEnter?: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  onmouseLeave?: (e: MouseEvent<HTMLDivElement>, index: number) => void;
  onClick: (e: MouseEvent<HTMLDivElement>, index: number) => void;
}

const Item = ({
  index,
  data,
  style,
  ariaAttributes,
  pxDispDecimal,
  onMouseEnter,
  onmouseLeave,
  onClick,
}: RowComponentProps<ItemProps>) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const {
    execution_price: price,
    size_delta_usd: size,
    action_time_ms: time,
    is_long: isLong,
    isOpen,
  } = data[index]!;

  return (
    <div style={style} className="pt-1">
      <div
        className={cn(
          'mt-1 flex cursor-pointer rounded-lg px-2 py-1 transition-[background] first:mt-0',
          isLong ? 'hover:bg-up/10' : 'hover:bg-down/10',
        )}
        onMouseEnter={(e) => onMouseEnter && onMouseEnter(e, index)}
        onMouseLeave={(e) => onmouseLeave && onmouseLeave(e, index)}
        onClick={(e) => {
          onClick(e, index);
        }}
        {...ariaAttributes}
      >
        <span className={cn('w-4/9', isLong ? 'text-up' : 'text-down')}>
          {truncateFormat(price, pxDispDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </span>
        <span className="w-2/9">
          {unitFormat(
            calc(size).times(isOpen ? 1 : -1),
            usdAmountDisplayDecimal,
            {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            },
          )}
        </span>
        <Time value={time} />
      </div>
    </div>
  );
};

export default Item;
