import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  getCachedPriceTickerData,
  useInstStore,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
  usePriceTickerStream,
  type Position,
} from '@/common';
import { useGlobalStore } from '@/common/stores';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import { calcLiqPxByPosition } from '@/lib/trade/formulas';

const USD_FORMAT = { style: 'currency', currency: 'USD' } as const;

interface PositionInfoCardProps {
  position: Position;
}

const PositionInfoCard: FC<PositionInfoCardProps> = ({ position }) => {
  const { t } = useLingui();
  const {
    marketAddress,
    isLong,
    sizeInUsd,
    collateralAmount,
    collateralTokenAddress,
    entryPrice,
  } = position;

  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const inst = insts[marketAddress || ''];
  const pxDispDecimal = inst?.pxDispDecimal;

  const markPrice = usePriceTickerStream(inst?.symbol, {
    throttleWait: 5000,
  }).data[0]?.p;

  // Calculate leverage
  const collateralTokenPx = getCachedPriceTickerExecutionPrice(
    getCreditAwareUsdPriceSymbol({
      isCreditMarket:
        position.isCreditMarket || inst?.category === CREDIT_MARKET_CATEGORY,
      tokenSymbol: coins[collateralTokenAddress]?.symbol,
    }),
    { isIncrease: false, isLong, priceType: 'min' },
  );
  const leverage =
    collateralTokenPx && collateralAmount
      ? calc(sizeInUsd)
          .div(calc(collateralAmount).times(collateralTokenPx))
          .toFixed()
      : '';

  // Calculate liq price
  const { data: marketConfig } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();
  const indexTokenPx =
    getCachedMarketExecutionPrice({
      symbol: inst?.symbol,
      indexTokenAddress: inst?.indexTokenAddress,
      isIncrease: false,
      isLong,
    }) || getCachedPriceTickerData(inst?.symbol)?.[0]?.p;

  const liqPx = calcLiqPxByPosition({
    position,
    collateralTokenPx,
    indexTokenPx,
    indexTokenDecimals: inst?.indexTokenAddress
      ? coins[inst.indexTokenAddress]?.decimals
      : undefined,
    marketConfigs: marketConfig,
    marketValues,
    minCollateralUsd: positionConstants?.minCollateralUsd,
  });

  const leverageText = leverage
    ? `${truncateFormat(leverage, leverDecimal, { stripTrailingZeros: true, round: ROUND_MODE.ROUND })}x`
    : '';

  return (
    <div className="bg-bg-3 flex flex-col items-start justify-between gap-2 rounded-xl p-3">
      {/* Symbol + Direction Tag */}
      <div className="flex items-center gap-2">
        <CoinIcon src={inst?.icon} alt={inst?.symbol} size={24} />
        <span className="text-t-1100 font-medium">
          {inst?.name || EMPTY_DISPLAY}
        </span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-xs font-medium',
            isLong ? 'bg-up/15 text-up' : 'bg-down/15 text-down',
          )}
        >
          {leverageText} {isLong ? t`Long` : t`Short`}
        </span>
      </div>

      {/* Price info */}
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-t-350 text-xs">{t`Entry Price`}</span>
          <span className="font-plex text-t-1100 text-sm">
            {truncateFormat(entryPrice, pxDispDecimal, USD_FORMAT)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-t-350 text-xs">{t`Mark Price`}</span>
          <span className="font-plex text-t-1100 text-sm">
            {markPrice
              ? truncateFormat(markPrice, pxDispDecimal, USD_FORMAT)
              : EMPTY_DISPLAY}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-t-350 text-xs">{t`Liq. Price`}</span>
          <span className="font-plex text-t-1100 text-sm">
            {liqPx && calc(liqPx).gt(0)
              ? truncateFormat(liqPx, pxDispDecimal, USD_FORMAT)
              : EMPTY_DISPLAY}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PositionInfoCard;
