import { FC, memo, useMemo } from 'react';
import Link from 'next/link';
import { useLingui } from '@lingui/react/macro';
import { DEFAULT_LOCALE } from '@repo/i18n/const';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { CoinIcon, usePriceTickerStream, useInstStore } from '@/common';
import { useTicker } from '@/services/rest/tickers';

interface ItemProps {
  instId: string;
  noBorder: boolean;
  onClick: () => void;
}

const Item: FC<ItemProps> = ({ instId, onClick, noBorder }) => {
  const {
    i18n: { locale = DEFAULT_LOCALE },
  } = useLingui();
  const { data: priceData } = usePriceTickerStream(instId);
  const { data: tickerData } = useTicker(instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());

  const { p: last = '' } = priceData[0] || {};
  const { open_price: priceOpen = '' } = tickerData || {};

  const [isUp, isDown, dispChg = EMPTY_DISPLAY] = useMemo(() => {
    const lastObj = calc(last);
    const chg = lastObj
      .minus(priceOpen)
      .div(priceOpen)
      .toFixed(4, ROUND_MODE.DOWN);
    const dispChg = percentFormat(chg, 2, { signDisplay: 'always' });

    return [lastObj.gt(priceOpen), lastObj.lt(priceOpen), dispChg];
  }, [last, priceOpen]);
  return (
    <Link
      href={`/${locale}/trade/${instId.replace('/', '-')}`}
      prefetch
      onClick={onClick}
      className="hover:bg-bg-3"
    >
      <div
        className={cn(
          'mx-4 flex min-h-13 items-center justify-between py-2 max-md:mx-2 max-md:text-base',
          noBorder ? '' : 'md:border-b',
        )}
      >
        <span className="flex w-1/2 items-center gap-2 font-medium max-md:gap-3">
          <CoinIcon
            src={inst?.icon}
            alt={inst?.name}
            size={24}
            className="max-md:size-8"
          />
          {inst?.name}
        </span>
        <span className="font-plex flex w-1/2 flex-col text-right">
          <span>
            {truncateFormat(
              priceData[0]?.p,
              coins[inst?.baseCoin || '']?.pxDispDecimal,
              {
                round: ROUND_MODE.DOWN,
                style: 'currency',
                currency: 'USD',
              },
            )}
          </span>
          <span
            className={cn(
              'text-xs max-md:text-sm',
              isUp ? 'text-up' : '',
              isDown ? 'text-down' : '',
            )}
          >
            {dispChg}
          </span>
        </span>
        {/* <span className="font-plex w-1/3 text-right">
          {unitFormat(tickerData?.volume ?? '', usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </span> */}
      </div>
    </Link>
  );
};

export default memo(Item);
