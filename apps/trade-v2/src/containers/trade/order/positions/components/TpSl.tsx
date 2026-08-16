import { FC, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import {
  cn,
  PencilLineIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  type Position,
} from '@/common';
import {
  useOpenOrders,
  useMarketConfigs,
  useMarketValues,
  useMarketIsDisabled,
  usePositionConstants,
} from '@/common/services';
import { useInstStore } from '@/common/stores';
import MarketIsClosedTooltip from '@/components/MarketIsClosedTooltip';
import { HYPER_SL_LOSS_CEIL, MAX_LOSS_RATE } from '@/constants/trade';
import { useMaxProfitRate } from '@/hooks/useMarketsStats';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import {
  calcCapTpPxAndSlPxOfPosition,
  calcLiqPxByPosition,
} from '@/lib/trade/formulas';
import { findNearestTpAndSlOrder } from '@/lib/trade/order';

interface TpSlProps {
  className?: string;
  position: Position;
  marketAddress: string;
  isLong: boolean;
  collateralTokenAddress: string;
  onOpenTpSlOrdersDialog: (position: Position) => void;
}

const TpSl: FC<TpSlProps> = ({
  className,
  position,
  marketAddress,
  isLong,
  onOpenTpSlOrdersDialog,
}) => {
  const { t } = useLingui();
  const { collateralTokenAddress } = position;
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const inst = insts[marketAddress || ''];
  const maxProfitRate = useMaxProfitRate(inst);

  const indexTokenPx = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong,
    throttleWait: 5000,
  });

  const { data: marketConfigs } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();

  const { data: orders } = useOpenOrders();
  const collateralToken = coins[collateralTokenAddress];
  const indexTokenDecimals = inst?.indexTokenAddress
    ? coins[inst.indexTokenAddress]?.decimals
    : undefined;
  const collateralTokenPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket:
        position.isCreditMarket || inst?.category === CREDIT_MARKET_CATEGORY,
      tokenSymbol: collateralToken?.symbol,
    }),
    isIncrease: false,
    isLong,
    priceType: 'min',
    throttleWait: 5000,
  });

  const { tpOrder, slOrder, tpCount, slCount, finalTpPx, slInValidText } =
    useMemo(() => {
      const { tpOrder, slOrder, tpCount, slCount } = findNearestTpAndSlOrder(
        orders || [],
        {
          marketAddress: inst?.marketTokenAddress || '',
          isLong,
          isZFP: position.isZFP,
        },
        indexTokenPx || '0',
      );
      const { tpCapPx, slCapPx, slFloorPx } = calcCapTpPxAndSlPxOfPosition({
        position,
        maxProfitRate: maxProfitRate,
        maxLossRate: MAX_LOSS_RATE,
        minLossRate: HYPER_SL_LOSS_CEIL,
        collateralTokenPx: collateralTokenPx,
        indexTokenPx: indexTokenPx,
        indexTokenDecimals,
        marketConfigs,
        marketValues,
      });
      const liqPx = calcLiqPxByPosition({
        position,
        collateralTokenPx,
        indexTokenPx,
        indexTokenDecimals,
        marketConfigs,
        marketValues,
        minCollateralUsd: positionConstants?.minCollateralUsd,
      });
      const _finalTpPx = tpOrder?.triggerPrice
        ? (isLong && calc(tpOrder.triggerPrice).gt(tpCapPx)) ||
          (!isLong && calc(tpOrder.triggerPrice).lt(tpCapPx))
          ? tpCapPx
          : tpOrder.triggerPrice
        : '';

      let slInValidText = '';
      if (slOrder?.triggerPrice) {
        if (
          (isLong && calc(slOrder.triggerPrice).lt(liqPx)) ||
          (!isLong && calc(slOrder.triggerPrice).gt(liqPx))
        ) {
          slInValidText = t`Invalid Stop Loss: Set SL Price is worse than Liq Price.`;
        } else if (
          (isLong && calc(slOrder.triggerPrice).lt(slCapPx)) ||
          (!isLong && calc(slOrder.triggerPrice).gt(slCapPx))
        ) {
          slInValidText = t`Invalid Stop Loss: Set SL Price is worse than the SL Price capped at -80% PnL%.`;
        } else if (
          slFloorPx !== undefined &&
          ((isLong && calc(slOrder.triggerPrice).gt(slFloorPx)) ||
            (!isLong && calc(slOrder.triggerPrice).lt(slFloorPx)))
        ) {
          slInValidText = t`Invalid Stop Loss: Set SL Price is beyond the SL Price capped at -30% PnL%.`;
        }
      }

      return {
        tpOrder,
        slOrder,
        tpCount,
        slCount,
        finalTpPx: _finalTpPx,
        slInValidText,
      };
    }, [
      collateralTokenPx,
      indexTokenPx,
      isLong,
      marketConfigs,
      marketValues,
      maxProfitRate,
      position,
      inst?.marketTokenAddress,
      indexTokenDecimals,
      orders,
      positionConstants?.minCollateralUsd,
      t,
    ]);

  const marketIsDisabled = useMarketIsDisabled(marketAddress);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="gap-1 max-md:flex">
        <div className="flex gap-1 max-md:justify-end">
          {tpOrder ? (
            <span>
              {tpOrder.triggerAboveThreshold ? '≥ ' : '≤ '}
              {truncateFormat(finalTpPx, inst?.pxDispDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
              {tpCount > 1 && <span className="ml-1 text-xs">({tpCount})</span>}
            </span>
          ) : (
            EMPTY_DISPLAY
          )}
        </div>
        <span className="md:hidden">/</span>
        <div className="flex gap-1 max-md:justify-end">
          {slOrder ? (
            <span>
              {slOrder.triggerAboveThreshold ? '≥ ' : '≤ '}
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    slInValidText
                      ? 'text-destructive decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-2'
                      : '',
                  )}
                >
                  {truncateFormat(slOrder?.triggerPrice, inst?.pxDispDecimal, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </TooltipTrigger>
                <TooltipContent
                  className={cn('w-42', slInValidText ? 'block' : 'hidden')}
                  collisionPadding={16}
                >
                  {slInValidText}
                </TooltipContent>
              </Tooltip>
              {slCount > 1 && <span className="ml-1 text-xs">({slCount})</span>}
            </span>
          ) : (
            EMPTY_DISPLAY
          )}
        </div>
      </div>
      <MarketIsClosedTooltip marketAddress={marketAddress}>
        <PencilLineIcon
          role="button"
          size={14}
          className={cn(
            'text-t-430 hover:text-t-1100 cursor-pointer',
            marketIsDisabled ? 'cursor-not-allowed' : '',
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (marketIsDisabled) return;
            onOpenTpSlOrdersDialog(position);
          }}
        />
      </MarketIsClosedTooltip>
    </div>
  );
};

export default TpSl;
