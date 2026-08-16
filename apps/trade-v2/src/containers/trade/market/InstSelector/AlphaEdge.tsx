import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import {
  cn,
  CreditIcon,
  HyperLevIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
} from '@/common';
import type { MarketConfig } from '@hertzflow/sdk-v2/types/markets';

interface AlphaEdgeProps {
  marketConfig?: MarketConfig;
  hasHyperLev: boolean;
  className?: string;
  isCreditMarket?: boolean;
}

const AlphaEdge: FC<AlphaEdgeProps> = ({
  marketConfig,
  hasHyperLev,
  className,
  isCreditMarket = false,
}) => {
  const { t } = useLingui();

  if (isCreditMarket) {
    return (
      <div className={cn('flex items-center justify-end', className)}>
        <span className="bg-accent/15 text-accent flex items-center gap-1 rounded-lg px-2 py-1 text-[10px]">
          <CreditIcon size={14} />
          {t`Credit`}
        </span>
      </div>
    );
  }

  const lrFactor = marketConfig?.lossRebateRate
    ? calc(marketConfig.lossRebateRate.toString())
        .div(CONTRACT_USD_MULTIPLIER)
        .toNumber()
    : undefined;

  const hasLossRebate = !!lrFactor;

  if (!hasHyperLev && !hasLossRebate) {
    return <span className={className}>-</span>;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {hasHyperLev && (
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-0.5">
            <span className="bg-hyper-lev/10 text-hyper-lev flex items-center gap-1 rounded-lg px-2 py-1">
              <HyperLevIcon size={14} />
              <span className="text-[10px]">{t`Hyper Lev`}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="text-t-270 w-80 rounded-2xl p-3"
          >
            <div className="font-medium">{t`Hyper Leverage Mode`}</div>
            <p className="mt-2 text-xs">
              {t`Ultra-high leverage trading with 0% fees. Conditional profit sharing applies.`}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
      {hasLossRebate && (
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-0.5">
            <span className="bg-loss-rebate/10 text-loss-rebate flex items-center gap-1 rounded-lg px-2 py-1">
              <VerifiedIcon size={14} />
              <span className="text-[10px]">{percentFormat(lrFactor, 0)}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="text-t-270 w-80 rounded-2xl p-3"
          >
            <div className="font-medium">{t`Loss Rebate`}</div>
            <p className="mt-2 text-xs">
              {t`Receive a rebate on trading losses. The rebate is determined at execution based on post-trade OI skew.`}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2 font-medium">
              <span className="text-t-1100">{t`Loss Rebate Rate`}:</span>
              <span className="text-accent text-right">
                {percentFormat(lrFactor, 2)}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default AlphaEdge;
