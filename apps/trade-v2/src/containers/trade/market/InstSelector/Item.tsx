'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type RowComponentProps } from 'react-window';
import { CoinIcon } from '@repo/common/components';
import { useNavItems } from '@repo/common/hooks';
import { BN, calc, ROUND_MODE } from '@repo/lib/calc';
import {
  EMPTY_DISPLAY,
  percentFormat,
  truncateFormat,
  unitFormat,
} from '@repo/lib/format';
import { ArrowUpRight2Icon, cn, CreditIcon } from '@repo/ui';
import {
  Inst,
  useMarketConfigs,
  useMarketValues,
  usePriceTickerStream,
} from '@/common';

import FavoriteBtn from '@/common/components/FavoriteBtn';
import { useTickers } from '@/common/services';
import { useGlobalStore } from '@/common/stores';
import StatusMarker from '@/components/StatusMarker';
import { checkMarketHasZFP } from '@/hooks/trade/useHasZFP';
import {
  getHyperLeverageRange,
  getMarketMaxLeverage,
} from '@/hooks/useMarketsStats';
import {
  buildTradeRouteInstIdByCategory,
  isCreditCategory,
} from '@/lib/credit/creditMarkets';
import { calcPriceChange } from '@/lib/trade/formulas';
import { usePreferenceStore } from '@/stores/trade/preference';
import AlphaEdge from './AlphaEdge';

interface ItemProps {
  onClick: (inst: Inst) => void;
  onFavoriteToggle: (marketAddress: string) => void;
  data: Inst[];
  marketsStats: Record<
    string,
    { liqLong: BN; liqShort: BN; oiLong: BN; oiShort: BN }
  >;
  collisionBoundary: HTMLElement | null;
}

const Item = ({
  index,
  style,
  data,
  marketsStats,
  onClick,
  onFavoriteToggle,
  collisionBoundary,
  ariaAttributes,
}: RowComponentProps<ItemProps>) => {
  const inst = data[index];
  const instId = inst!.id;
  const instSymbol = inst!.symbol;
  const instName = inst!.name;

  const router = useRouter();

  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const { data: priceData } = usePriceTickerStream(instSymbol);
  const { data: tickerData } = useTickers({
    marketAddress: inst?.marketTokenAddress,
    symbol: inst?.symbol,
  });

  const { open_24h: priceOpen = '', current_price = '' } = tickerData || {};
  const { p: last = current_price } = priceData[0] || {};

  const { isUp, isDown, chg } = useMemo(
    () => calcPriceChange(last, priceOpen),
    [last, priceOpen],
  );
  const dispChg =
    percentFormat(chg, 2, { signDisplay: 'never' }) || EMPTY_DISPLAY;

  const marketStats = marketsStats[inst?.marketTokenAddress || ''];
  const isCreditMarket = isCreditCategory(inst?.category);
  const { data: marketConfig } = useMarketConfigs(inst);
  useMarketValues(inst);
  const maxNormalLeverage = getMarketMaxLeverage(inst, marketConfig);
  const supportsHyper = checkMarketHasZFP(inst, marketConfig);
  const hyperLeverageRange = getHyperLeverageRange(inst, marketConfig);
  const maxLeverage = supportsHyper
    ? hyperLeverageRange.max
    : maxNormalLeverage;

  const isFavorite = usePreferenceStore((state) =>
    state.isFavorite(inst?.marketTokenAddress || ''),
  );
  const marketAddress = inst?.marketTokenAddress || '';

  const { trade } = useNavItems();
  const href = `${trade.link}/${buildTradeRouteInstIdByCategory(
    instName,
    inst?.category,
  )}`;
  return (
    <Link
      href={href}
      style={style}
      onMouseEnter={() => router.prefetch(href)}
      onPointerDown={() => router.prefetch(href)}
      key={instId}
      onClick={() => onClick(inst!)}
      {...ariaAttributes}
    >
      <div
        className={cn(
          'hover:bg-bg-4 mt-1 flex min-h-13 items-center justify-between rounded-xl px-2 py-2 transition-[background] max-md:text-base',
        )}
      >
        <span className="flex w-11/48 min-w-0 shrink-0 grow-0 items-center font-medium max-md:w-1/2 max-md:gap-2">
          <FavoriteBtn
            isFavorite={isFavorite}
            onToggle={() => {
              if (!marketAddress) {
                return;
              }
              onFavoriteToggle(marketAddress);
            }}
            className="mr-1 max-md:mr-0"
          />
          <CoinIcon
            src={inst?.icon}
            alt={inst?.name}
            size={24}
            className="mr-1 ml-1 max-md:mr-0 max-md:ml-0 max-md:size-9!"
          />
          {inst?.name}
          {isCreditMarket && (
            <CreditIcon
              size={14}
              className="text-accent max-md:shrink-0 md:hidden"
            />
          )}
          <span className="font-plex bg-bg-5 mr-1 ml-1 rounded-sm px-1 py-1 text-[10px] max-md:mx-0">
            {`${truncateFormat(maxLeverage, leverDecimal, {
              stripTrailingZeros: true,
              round: ROUND_MODE.ROUND,
            })}x`}
          </span>
          <StatusMarker
            inst={inst}
            sideOffset={12}
            collisionBoundary={collisionBoundary ?? undefined}
            collisionPadding={0}
          />
        </span>
        <span className="font-plex flex w-1/8 shrink-0 grow-0 flex-col max-md:w-1/2 max-md:text-right">
          <span>
            {truncateFormat(last, inst?.pxDispDecimal, {
              round: ROUND_MODE.DOWN,
              style: 'currency',
              currency: 'USD',
            })}
          </span>
          <span
            className={cn(
              'hidden text-xs max-md:block max-md:text-sm',
              isUp ? 'text-up' : '',
              isDown ? 'text-down' : '',
            )}
          >
            {isUp ? '↑' : ''}
            {isDown ? '↓' : ''}
            <span className="font-plex">{dispChg}</span>
          </span>
        </span>
        <span className="flex w-1/12 shrink-0 grow-0 flex-col max-md:hidden max-md:text-right">
          <span
            className={cn(
              'text-xs max-md:text-sm',
              isUp ? 'text-up' : '',
              isDown ? 'text-down' : '',
            )}
          >
            {isUp ? '↑' : ''}
            {isDown ? '↓' : ''}
            <span className="font-plex">{dispChg}</span>
          </span>
        </span>
        <span className="font-plex w-1/8 shrink-0 grow-0 max-md:hidden">
          {unitFormat(tickerData?.volume_24h || '', usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </span>
        <span className="flex w-1/8 shrink-0 grow-0 flex-col max-md:hidden">
          <span className="flex items-center gap-0.5">
            <ArrowUpRight2Icon size={14} className="text-up" />
            <span className="font-plex">
              {unitFormat(
                calc(marketStats?.oiLong || ''),
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </span>
          </span>
          <span className="flex items-center gap-0.5">
            <ArrowUpRight2Icon size={14} className="text-down rotate-90" />
            <span className="font-plex">
              {unitFormat(
                calc(marketStats?.oiShort || ''),
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </span>
          </span>
        </span>
        <span className="flex w-7/48 shrink-0 grow-0 max-md:hidden">
          <div className="flex flex-col">
            <span className="flex items-center gap-0.5">
              <ArrowUpRight2Icon size={14} className="text-up" />
              <span className="font-plex">
                {unitFormat(
                  marketStats?.liqLong || '',
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                  },
                )}
              </span>
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowUpRight2Icon size={14} className="text-down rotate-90" />
              <span className="font-plex">
                {unitFormat(
                  marketStats?.liqShort || '',
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                  },
                )}
              </span>
            </span>
          </div>
        </span>
        <AlphaEdge
          marketConfig={marketConfig}
          hasHyperLev={supportsHyper}
          isCreditMarket={isCreditMarket}
          className="flex w-1/6 shrink-0 grow-0 items-center justify-end max-md:hidden"
        />
      </div>
    </Link>
  );
};

export default Item;
