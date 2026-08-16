import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  useGlobalStore as useCommonGlobalStore,
} from '@/common';
import type { LossRebateEstimateResult } from '@/common/hooks/useLossRebateEstimate';
import ListItem from '@/components/ListItem';
import { useTradeStore } from '../store';

interface LossRebateProps {
  curPendingLossRebateUsd?: string;
  nextEstimate: LossRebateEstimateResult;
  lossRebateRate?: bigint;
}

const LossRebate: FC<LossRebateProps> = ({
  curPendingLossRebateUsd,
  nextEstimate,
  lossRebateRate,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const smDialogOpen = useTradeStore((state) => state.smDialogOpen);

  const lrFactor = lossRebateRate
    ? percentFormat(
        calc(lossRebateRate.toString()).div(CONTRACT_USD_MULTIPLIER),
        0,
      )
    : '';
  const curLr = curPendingLossRebateUsd || '0';
  const hasCur = calc(curLr).gt(0);
  const nextLr = calc(curLr).plus(nextEstimate.rebateUsd);
  const fmtOpts = {
    style: 'currency' as const,
    currency: 'USD',
  };
  const dispNext = `${truncateFormat(nextLr, usdAmountDisplayDecimal, fmtOpts)}`;
  const dispCur = truncateFormat(curLr, usdAmountDisplayDecimal, fmtOpts);

  return (
    <ListItem
      label={
        <span className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger className="decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-3">
              {t`Loss Rebate`}
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[280px]"
              inDialog={smDialogOpen}
              collisionBoundary={document.querySelector('.tradingContainer')}
              collisionPadding={smDialogOpen ? 16 : 8}
            >
              {t`Loss Rebate is determined at execution, based on post-trade OI skew, and remains fixed for the position's lifetime.`}
            </TooltipContent>
          </Tooltip>
          <span className="text-loss-rebate flex items-center gap-0.5">
            <VerifiedIcon size={12} />
            {lrFactor ? lrFactor : ''}
          </span>
        </span>
      }
      value={
        hasCur ? (
          <>
            <span className="text-t-270">
              {`≤ ${dispCur}`}
              {' → '}
            </span>
            {`≤ ${dispNext}`}
          </>
        ) : (
          `≤ ${dispNext}`
        )
      }
    />
  );
};

export default LossRebate;
