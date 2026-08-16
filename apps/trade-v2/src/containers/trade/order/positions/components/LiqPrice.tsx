import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import {
  usePriceTickerStream,
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
  useInstStore,
  type Position,
  getCachedPriceTickerData,
  useMarketConfigs,
  useMarketValues,
  usePositionConstants,
} from '@/common';
import { useReferralDiscountRate } from '@/hooks/useReferralDiscount';
import { getEffectiveReferralDiscountRate } from '@/lib/credit/creditReferral';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import { calcLiqPxByPosition } from '@/lib/trade/formulas';

interface LiqPriceProps {
  id: string;
  instId?: string;
  marketAddress?: string;
  entryPrice: string;
  sizeInUsd: string;
  collateralAmount: string;
  collateralTokenAddress: string;
  isLong: boolean;
  position: Position;
}

const LiqPrice: FC<LiqPriceProps> = ({
  instId,
  marketAddress,
  collateralTokenAddress,
  position,
}) => {
  const { t } = useLingui();
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId || marketAddress || ''];
  const pxDispDecimal = inst?.pxDispDecimal;
  const coins = useInstStore((state) => state.getCoins());

  const { data: marketConfig } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();
  const { data: referralDiscountRate = '0' } = useReferralDiscountRate();
  const isCreditMarket =
    position.isCreditMarket || inst?.category === CREDIT_MARKET_CATEGORY;
  const collateralTokenPx = getCachedPriceTickerExecutionPrice(
    getCreditAwareUsdPriceSymbol({
      isCreditMarket,
      tokenSymbol: coins[collateralTokenAddress]?.symbol,
    }),
    { isIncrease: false, isLong: position.isLong, priceType: 'min' },
  );
  const indexTokenPx =
    getCachedMarketExecutionPrice({
      symbol: inst?.symbol,
      indexTokenAddress: inst?.indexTokenAddress,
      isIncrease: false,
      isLong: position.isLong,
    }) || getCachedPriceTickerData(inst?.symbol)?.[0]?.p;
  const liqPx = calcLiqPxByPosition({
    position,
    collateralTokenPx: collateralTokenPx,
    indexTokenPx,
    indexTokenDecimals: inst?.indexTokenAddress
      ? coins[inst.indexTokenAddress]?.decimals
      : undefined,
    marketConfigs: marketConfig,
    marketValues,
    minCollateralUsd: positionConstants?.minCollateralUsd,
    positionFeeDiscountRate: getEffectiveReferralDiscountRate({
      isCreditMarket,
      referralDiscountRate,
    }),
  });

  const { data: marketPxData } = usePriceTickerStream(inst?.symbol);

  const marketPrice = marketPxData[0]?.p;
  const [showTooltip, showWarningColor] = useMemo(() => {
    if (!liqPx || calc(liqPx).lte(0) || !marketPrice) {
      return [false, false];
    }

    const diff = calc(marketPrice).minus(liqPx).abs().div(liqPx);

    return [diff.lt(0.05), diff.lt(0.01)];
  }, [liqPx, marketPrice]);

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          'font-plex text-left leading-tight max-md:text-sm',
          showTooltip
            ? 'decoration-t-430 font-plex cursor-pointer leading-tight underline decoration-dotted underline-offset-2'
            : 'cursor-auto',
          showWarningColor ? 'text-warning decoration-warning' : '',
        )}
      >
        {truncateFormat(calc(liqPx).lte(0) ? '' : liqPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      </TooltipTrigger>
      {showTooltip && (
        <TooltipContent side="top" className="w-[224px]">
          <p>{t`Liquidation risk accounts for both collateral and accrued fees. Even in the absence of price changes, accrued borrowing fees may trigger liquidation.`}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default LiqPrice;
