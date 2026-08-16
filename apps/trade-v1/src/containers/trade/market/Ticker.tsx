import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { usePriceTickerStream, useInstStore } from '@/common';
import { useTicker } from '@/services/rest/tickers';
import { useGlobalStore } from '@/stores/trade/global';

const Ticker = () => {
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const { data: tickerData } = useTicker(instId);

  const { data: priceData } = usePriceTickerStream(instId);
  const { p: last = '' } = priceData[0] || {};
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;
  return (
    <>
      <div className="flex h-full shrink-0 flex-col justify-between md:mr-4">
        {/* 24h hight */}
        <div className="text-t-270 text-xs font-normal">{t`24h High`}</div>
        <div className="font-plex text-sm">
          {truncateFormat(
            calc(last).gt(tickerData?.high_price || '')
              ? last
              : tickerData?.high_price,
            pxDispDecimal,
            {
              style: 'currency',
              currency: 'USD',
            },
          )}
        </div>
      </div>
      <div className="flex h-full shrink-0 flex-col justify-between">
        {/* 24h low */}
        <div className="text-t-270 text-xs font-normal">{t`24h Low`}</div>
        <div className="font-plex text-sm">
          {truncateFormat(
            calc(last).lt(tickerData?.low_price || '')
              ? last
              : tickerData?.low_price,
            pxDispDecimal,
            {
              style: 'currency',
              currency: 'USD',
            },
          )}
        </div>
      </div>
      {/* <div className="flex shrink-0 flex-col justify-between"> */}
      {/* 24h vol */}
      {/* <div className="text-t-270 text-xs font-normal">{t`24h Vol`}</div>
        <div className="font-plex text-sm">
          {unitFormat(tickerData?.volumn ?? '',usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </div>
      </div> */}
    </>
  );
};

export default memo(Ticker);
