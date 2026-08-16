'use client';

import { memo, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { usePriceTickerStream, useInstStore } from '@/common';
import { useTicker } from '@/services/rest/tickers';
import { useGlobalStore } from '@/stores/trade/global';

const Price = () => {
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const { data: priceData } = usePriceTickerStream(instId);

  const { data: tickerData } = useTicker(instId);
  const { p: last = '', isLiveUp, isLiveDown } = priceData[0] || {};
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

  const dispPx = truncateFormat(
    last,
    coins[inst?.baseCoin || '']?.pxDispDecimal,
    {
      round: ROUND_MODE.DOWN,
      style: 'currency',
      currency: 'USD',
    },
  );
  const coin = instId.split('/')[0];
  window.document.title = t`${dispPx} | ${coin} | HertzFlow`;

  return (
    <div className="font-plex flex h-full shrink-0 flex-col justify-between">
      <span
        className={cn(
          'text-lg font-medium max-md:text-xl',
          isLiveUp ? 'text-up' : '',
          isLiveDown ? 'text-down' : '',
        )}
      >
        {dispPx}
      </span>
      <div
        className={cn(
          'text-xs max-md:text-right max-md:font-medium',
          isUp ? 'text-up' : '',
          isDown ? 'text-down' : '',
        )}
      >
        {dispChg}
      </div>
    </div>
  );
};

export default memo(Price);
