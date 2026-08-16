import { useEffect, useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import {
  unitFormat,
  percentFormat,
  EMPTY_DISPLAY_SHORT,
} from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

const formatPnl = (value: string | undefined): string => {
  if (value === undefined) return EMPTY_DISPLAY_SHORT;
  return unitFormat(value, 2, {
    minNumber: 1000000,
    showMinDecimalValue: true,
    stripTrailingZeros: true,
    signDisplay: 'always',
    style: 'currency',
    currency: 'USD',
  });
};

interface PnlCardProps {
  label: string;
  tooltip: string;
  pnl: string | undefined;
  pnlPercent: string | undefined;
  isDisconnected?: boolean;
  isPositive: boolean;
}

const PnlCard = ({
  label,
  tooltip,
  pnl,
  pnlPercent,
  isPositive,
}: PnlCardProps) => {
  const [collisionBoundaryEle, setCollisionBoundaryEle] =
    useState<Element | null>(null);
  useEffect(() => {
    setCollisionBoundaryEle(document.querySelector('.accountDrawerContainer'));
  }, []);

  return (
    <div className="border-border flex flex-1 flex-col gap-1 rounded-xl border p-3">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger>
            <span className="text-t-350 decoration-t-430 text-xs underline decoration-dotted underline-offset-2">
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="w-65 whitespace-pre-line"
            collisionBoundary={collisionBoundaryEle}
            collisionPadding={16}
            inDialog
          >
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <span className={cn('font-plex text-t-1100 text-xl font-medium')}>
        {formatPnl(pnl)}
      </span>
      <span
        className={cn(
          'text-xs',
          pnlPercent === undefined
            ? 'text-t-350'
            : isPositive
              ? 'text-up'
              : 'text-down',
        )}
      >
        {pnlPercent !== undefined
          ? percentFormat(pnlPercent, 2, { signDisplay: 'always' })
          : EMPTY_DISPLAY_SHORT}
      </span>
    </div>
  );
};

interface PnlCardsProps {
  totalPnl: string | undefined;
  totalBought: string | undefined;
  unrealisedPnl: string | undefined;
  unrealisedBought: string | undefined;
  isDisconnected: boolean;
}

const PnlCards = ({
  totalPnl,
  totalBought,
  unrealisedPnl,
  unrealisedBought,
  isDisconnected,
}: PnlCardsProps) => {
  const { t } = useLingui();

  // Total PnL % = totalPnl / totalBought
  const totalPnlPercent = useMemo(() => {
    if (!totalPnl || !totalBought || isDisconnected) return undefined;
    const pnlNum = parseFloat(totalPnl);
    const boughtNum = parseFloat(totalBought);
    if (isNaN(pnlNum) || isNaN(boughtNum) || boughtNum === 0) return undefined;
    return calc(pnlNum).div(boughtNum).toFixed();
  }, [totalPnl, totalBought, isDisconnected]);

  // Unrealised PnL % = unrealisedPnl / unrealisedBought
  const unrealisedPnlPercent = useMemo(() => {
    if (!unrealisedPnl || !unrealisedBought || isDisconnected) return undefined;
    const pnlNum = parseFloat(unrealisedPnl);
    const boughtNum = parseFloat(unrealisedBought);
    if (isNaN(pnlNum) || isNaN(boughtNum) || boughtNum === 0) return undefined;
    return calc(pnlNum).div(boughtNum).toFixed();
  }, [unrealisedPnl, unrealisedBought, isDisconnected]);

  return (
    <div className="flex gap-2">
      <PnlCard
        label={t`Total PnL`}
        tooltip={t`Total PnL ($) = Unrealised PnL + Realised PnL\nTotal PnL (%) = Total PnL / Total Invested`}
        pnl={totalPnl}
        pnlPercent={totalPnlPercent}
        isPositive={totalPnl !== undefined && parseFloat(totalPnl) >= 0}
      />
      <PnlCard
        label={t`Unrealised PnL`}
        tooltip={t`Unrealised PnL ($) = Positions Gross PnL + Earnings from LP Held\nUnrealised PnL (%) = Unrealised PnL / Total Invested`}
        pnl={unrealisedPnl}
        pnlPercent={unrealisedPnlPercent}
        isPositive={
          unrealisedPnl !== undefined && parseFloat(unrealisedPnl) >= 0
        }
      />
    </div>
  );
};

export default PnlCards;
