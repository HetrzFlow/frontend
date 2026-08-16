import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';

import { calc } from '@repo/lib/calc';
import { truncateFormat, unitFormat } from '@repo/lib/format';
import { Skeleton, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { usePriceTickerStream, useInstStore, useGlobalStore } from '@/common';
import { useTickers } from '@/common/services';
import { useTradeGlobalStore } from '@/stores/trade/global';

interface TickerItemProps {
  label: string;
  description: string;
  value: string;
  isLoading: boolean;
  pxDispDecimal?: number;
  triggerClassName: string;
}

const TickerItem = ({
  label,
  description,
  value,
  isLoading,
  triggerClassName,
}: TickerItemProps) => {
  return (
    <Tooltip>
      <TooltipTrigger className={triggerClassName}>
        <div className="text-t-270 text-[10px] font-normal max-md:text-xs">
          {label}
        </div>
        {!isLoading ? (
          <div className="font-plex max-md:text-base">{value}</div>
        ) : (
          <Skeleton className="h-3.5 w-14" />
        )}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="text-t-270 flex w-90 flex-col gap-2 rounded-2xl p-3"
      >
        {description}
      </TooltipContent>
    </Tooltip>
  );
};

const Ticker = () => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const { data: tickerData, isLoading } = useTickers({
    marketAddress: inst?.marketTokenAddress,
    symbol: inst?.symbol,
  });
  const { data: priceData } = usePriceTickerStream(inst?.symbol);
  const { p: last = '' } = priceData[0] || {};
  const {
    high_24h: high24h = '',
    low_24h: low24h = '',
    volume_24h: vol24h,
  } = tickerData || {};
  const triggerClassName =
    'hover:bg-bg-3 flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1 max-md:gap-1 max-md:p-0';

  const items = useMemo(() => {
    return [
      {
        key: 'high',
        label: t`24h High`,
        description: t`The highest oracle price in this market over the last 24 hours.`,
        value: truncateFormat(
          last && calc(last).gt(high24h) ? last : high24h,
          inst?.pxDispDecimal,
          {
            style: 'currency',
            currency: 'USD',
          },
        ),
        triggerClassName: `${triggerClassName} md:mr-0`,
      },
      {
        key: 'low',
        label: t`24h Low`,
        description: t`The lowest oracle price in this market over the last 24 hours.`,
        value: truncateFormat(
          last && calc(last).lt(low24h) ? last : low24h,
          inst?.pxDispDecimal,
          {
            style: 'currency',
            currency: 'USD',
          },
        ),
        triggerClassName,
      },
      {
        key: 'vol',
        label: t`24h Volume`,
        description: t`Total trading volume of this market in the past 24 hours.`,
        value: unitFormat(vol24h ?? '', usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
        }),
        triggerClassName,
      },
    ];
  }, [
    high24h,
    last,
    low24h,
    t,
    triggerClassName,
    inst?.pxDispDecimal,
    usdAmountDisplayDecimal,
    vol24h,
  ]);

  return (
    <>
      {items.map(({ key, label, description, value, triggerClassName }) => (
        <TickerItem
          key={key}
          label={label}
          description={description}
          value={value}
          isLoading={isLoading}
          pxDispDecimal={inst?.pxDispDecimal}
          triggerClassName={triggerClassName}
        />
      ))}
    </>
  );
};

export default Ticker;
