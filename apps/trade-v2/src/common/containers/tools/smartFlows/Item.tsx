import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import {
  dateFormat,
  formatAddress,
  truncateFormat,
  unitFormat,
} from '@repo/lib/format';
import { cn, MoneyIcon } from '@repo/ui';
import { useInstStore } from '@/common/stores';

interface ItemProps {
  userAvatar?: string;
  userAddress: string;
  isLong: boolean;
  time: number;
  symbol: string;
  size: string;
  price: string;
  pnl: string;
}

const Item: FC<ItemProps> = ({
  userAvatar,
  userAddress,
  isLong,
  symbol,
  time,
  size,
  price,
  pnl,
}) => {
  const { t } = useLingui();
  const inst = useInstStore((state) =>
    state.getInstsArr().find((candidate) => candidate.symbol === symbol),
  );
  return (
    <div className="hover:bg-bg-3 flex cursor-pointer flex-col gap-1 rounded-xl px-2 py-1 transition-[background]">
      <div className="flex items-center gap-1">
        <CoinIcon size={16} src={userAvatar} />
        <div className="shrink-0">
          {formatAddress(userAddress, { prefixLength: 2, suffixLength: 4 })}
        </div>

        <span className="ml-1 flex shrink-0 items-center">
          <MoneyIcon
            size={16}
            className={cn('mr-1', isLong ? 'text-up' : 'text-down')}
          />
          {isLong ? t`Longed` : t`Shorted`}{' '}
          {unitFormat(size, 1, {
            style: 'currency',
            currency: 'USD',
            unitDecimal: 1,
          })}{' '}
          {symbol.split('/')[0]} {t`at`}
        </span>
        <div className="text-t-350 ml-auto shrink-0">
          {dateFormat(time, 'HH:mm:ss')}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <CoinIcon size={16} src={inst?.icon} />
        <span className="text-t-350">{t`Price`}</span>
        <span className="text-accent">
          {truncateFormat(price, inst?.pxDispDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="text-t-350">{t`PnL`}</span>
          <span>
            {unitFormat(pnl, 1, {
              style: 'currency',
              currency: 'USD',
              unitDecimal: 1,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Item;
