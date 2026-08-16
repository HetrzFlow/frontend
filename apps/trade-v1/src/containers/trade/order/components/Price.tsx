import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { truncateFormat } from '@repo/lib/format';
import { cn, PencilLineIcon } from '@repo/ui';
import { useInstStore } from '@/common';

interface PriceProps {
  targetCoin: string;
  price: string;
  triggerPriceAboveAllowed?: boolean;
  isMarket?: boolean;
  className?: string;
  onEdit?: () => void;
}

const Price: FC<PriceProps> = ({
  targetCoin,
  price,
  triggerPriceAboveAllowed,
  isMarket,
  className,
  onEdit,
}) => {
  const { t } = useLingui();
  const inst = useInstStore((state) => state.getInstsArr()).find(
    (v) => v.coinType === targetCoin,
  );
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;

  return (
    <div
      className={cn(
        'font-plex flex items-center gap-1 leading-tight max-md:text-sm',
        className,
      )}
    >
      {isMarket
        ? t`market`
        : triggerPriceAboveAllowed !== undefined
          ? triggerPriceAboveAllowed
            ? '≥ '
            : '≤ '
          : ''}
      {!isMarket &&
        truncateFormat(price, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}

      {onEdit && (
        <PencilLineIcon
          size={14}
          className="text-t-430 hover:text-t-1100 cursor-pointer"
          onClick={() => {
            // edit price dialog
            onEdit();
          }}
        />
      )}
    </div>
  );
};

export default Price;
