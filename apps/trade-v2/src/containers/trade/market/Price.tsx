'use client';

import { FC, useEffect, useMemo } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { ROUND_MODE } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import {
  cn,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { usePriceTickerStream, useInstStore } from '@/common';
import { useTickers } from '@/common/services';
import { getShortInstName } from '@/common/utils/inst';
import { calcPriceChange } from '@/lib/trade/formulas';
import { useTradeGlobalStore } from '@/stores/trade/global';

interface PriceProps {
  disabledTooltip?: boolean;
}

interface PriceContentProps {
  isLiveUp?: boolean;
  isLiveDown?: boolean;
  isUp: boolean;
  isDown: boolean;
  hasPrice: boolean;
  dispPx: string;
  dispChg: string;
}

const PriceContent: FC<PriceContentProps> = ({
  isLiveUp,
  isLiveDown,
  isUp,
  isDown,
  hasPrice,
  dispPx,
  dispChg,
}) => {
  return (
    <>
      <span
        className={cn(
          'text-lg font-medium max-md:text-xl',
          isLiveUp ? 'text-up' : '',
          isLiveDown ? 'text-down' : '',
        )}
      >
        {hasPrice ? dispPx : <Skeleton className="h-5 w-20" />}
      </span>
      <div
        className={cn(
          'text-xs max-md:text-right max-md:font-medium',
          isUp ? 'text-up' : '',
          isDown ? 'text-down' : '',
        )}
      >
        {hasPrice ? dispChg : <Skeleton className="h-3.5 w-10" />}
      </div>
    </>
  );
};

const Price: FC<PriceProps> = ({ disabledTooltip = false }) => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const { data: priceData } = usePriceTickerStream(inst?.symbol);

  const { data: tickerData } = useTickers({
    marketAddress: inst?.marketTokenAddress,
    symbol: inst?.symbol,
  });
  const { open_24h: priceOpen = '', current_price = '' } = tickerData || {};
  const { p: last = current_price, isLiveUp, isLiveDown } = priceData[0] || {};

  const { isUp, isDown, chg } = useMemo(
    () => calcPriceChange(last, priceOpen),
    [last, priceOpen],
  );
  const dispChg = percentFormat(chg, 2, { signDisplay: 'always' });

  const dispPx = truncateFormat(last, inst?.pxDispDecimal, {
    round: ROUND_MODE.DOWN,
    style: 'currency',
    currency: 'USD',
  });
  const shortInstName = getShortInstName(inst);
  const hasPrice = !!last;

  useEffect(() => {
    if (!last) return;

    window.document.title = t`${dispPx} | ${shortInstName} | HertzFlow`;
  }, [dispPx, last, shortInstName, t]);

  const content = (
    <PriceContent
      isLiveUp={isLiveUp}
      isLiveDown={isLiveDown}
      isUp={isUp}
      isDown={isDown}
      hasPrice={hasPrice}
      dispPx={dispPx}
      dispChg={dispChg}
    />
  );

  if (disabledTooltip) {
    return (
      <div className="font-plex hover:bg-bg-3 flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1">
        {content}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger className="font-plex hover:bg-bg-3 flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1">
        {content}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="flex w-90 flex-col gap-2 rounded-2xl p-3"
      >
        <div>
          <Trans>
            <span className="text-t-1100">Mark Price: </span>
            <span className="text-t-270">
              The reference price for liquidations, PnL, and order execution,
              secured by multi-oracle validation to reduce manipulation and
              volatility.
            </span>
          </Trans>
        </div>
        <div>
          <Trans>
            <span className="text-t-1100">24h Change: </span>
            <span className="text-t-270">
              Percentage change in mark price over the last 24 hours.
            </span>
          </Trans>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default Price;
