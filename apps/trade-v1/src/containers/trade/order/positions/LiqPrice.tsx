import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { usePriceTickerStream, useInstStore, useLiqPx } from '@/common';

interface LiqPriceProps {
  id: string;
  targetCoin: string;
  entryPrice: string;
  size: string;
  collateral: string;
  isLong: boolean;
  entryFundingRate: string;
}

const LiqPrice: FC<LiqPriceProps> = ({
  targetCoin,
  entryPrice,
  size,
  collateral,
  entryFundingRate,
  isLong,
}) => {
  const { t } = useLingui();
  const [inst, usdcCoin] = useInstStore(
    useShallow((state) => [
      state.getInstsArr().find((v) => v.coinType === targetCoin),
      state.getUsdcCoin(state),
    ]),
  );
  const coins = useInstStore((state) => state.getCoins());
  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;

  const { data: liqPx } = useLiqPx({
    collateralCoinType: isLong ? inst?.baseCoin : usdcCoin?.coinType,
    entryPrice: entryPrice,
    collateral: collateral,
    size,
    isLong,
    entryFundingRate: entryFundingRate,
    hasPosition: true,
  });

  const { data: marketPxData } = usePriceTickerStream(inst?.id);

  const [showTooltip, showWarningColor] = useMemo(() => {
    if (!liqPx || !marketPxData[0]?.p) {
      return [false, false];
    }

    const diff = calc(marketPxData[0].p).minus(liqPx).abs().div(liqPx);

    return [diff.lt(0.05), diff.lt(0.01)];
  }, [liqPx, marketPxData[0]?.p]);

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
        {truncateFormat(liqPx, pxDispDecimal, {
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
