import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import {
  useGlobalStore,
  useMarketValues,
  CONTRACT_USD_MULTIPLIER,
  useMarketConfigs,
  useInstStore,
  CREDIT_MARKET_CATEGORY,
} from '@/common';
import { useHasZFP } from '@/hooks/trade/useHasZFP';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';

interface LossRebateProps {
  marketAddress: string;
  className?: string;
}

const LossRebate: FC<LossRebateProps> = ({ marketAddress, className }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const { data: marketConfig } = useMarketConfigs(
    marketAddress ? { marketTokenAddress: marketAddress } : undefined,
  );
  const { data: marketValues } = useMarketValues(
    marketAddress ? { marketTokenAddress: marketAddress } : undefined,
  );

  // Loss Rebate factor: convert from contract precision (bigint) to decimal ratio (e.g. 0.08 = 8%)
  const lrFactor = marketConfig?.lossRebateRate
    ? calc(marketConfig.lossRebateRate.toString())
        .div(CONTRACT_USD_MULTIPLIER)
        .toNumber()
    : undefined;

  // Determine weak side dynamically from live OI data
  const longOi = calc(marketValues?.longInterestUsd?.toString() ?? '0').div(
    CONTRACT_USD_MULTIPLIER,
  );
  const shortOi = calc(marketValues?.shortInterestUsd?.toString() ?? '0').div(
    CONTRACT_USD_MULTIPLIER,
  );
  const oiBalanced = longOi.eq(shortOi);
  const weakSide = oiBalanced ? null : longOi.lt(shortOi) ? t`Long` : t`Short`;

  const sumOi = longOi.plus(shortOi);
  const oiSkew =
    sumOi.isNaN() || sumOi.eq(0) ? '0' : longOi.minus(shortOi).abs();

  // Check if current mode is ZFP (Hyper Leverage) — Loss Rebate is N/A in that mode
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const supportsHyper = useHasZFP(inst);
  const leverageMode = usePreferenceStore((state) => state.leverageMode);
  const isZFP = leverageMode === 'hyper' && supportsHyper;

  const hasLossRebate = !!lrFactor;

  if (inst?.category === CREDIT_MARKET_CATEGORY) {
    return null;
  }

  const tooltipContent = (
    <TooltipContent
      side="bottom"
      className="text-t-270 w-80 rounded-2xl p-3 text-xs"
    >
      <p>
        {t`Loss Rebate is determined at execution, based on post-trade OI skew, and remains fixed for the position's lifetime.`}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 font-medium">
        <span className="text-t-1100">{t`OI Skew:`}</span>
        <span className="text-accent text-right">
          {unitFormat(oiSkew, usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </span>
      </div>
    </TooltipContent>
  );

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          'hover:bg-bg-3 flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1 max-md:gap-1 max-md:p-0 md:mr-0',
          className,
        )}
      >
        <p className="text-t-270 text-[10px] max-md:text-xs">{t`Loss Rebate`}</p>
        {hasLossRebate && !isZFP && weakSide ? (
          <span className="flex items-center gap-0.5">
            <span className="font-plex font-medium max-md:text-base">
              {weakSide} {percentFormat(lrFactor, 0)}
            </span>
            <VerifiedIcon size={14} className="text-loss-rebate" />
          </span>
        ) : (
          <span className="text-t-430 font-plex font-medium max-md:text-base">{t`N/A`}</span>
        )}
      </TooltipTrigger>
      {tooltipContent}
    </Tooltip>
  );
};

export default LossRebate;
