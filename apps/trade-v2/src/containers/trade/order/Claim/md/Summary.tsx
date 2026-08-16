import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useGlobalStore } from '@/common';
import TotalClaimableText from '../components/TotalClaimableText';
import { useClaimStore } from '../store';

interface SummaryProps {
  claimableCount: number;
  totalClaimed?: string;
}

const Summary: FC<SummaryProps> = ({ totalClaimed }) => {
  const { t } = useLingui();

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [claimableFundingFeeUsd, claimablePriceImpactUsd] = useClaimStore(
    useShallow(
      (state) =>
        [state.claimableFundingFeeUsd, state.claimablePriceImpactUsd] as const,
    ),
  );

  const totalClaimable = calc(claimableFundingFeeUsd)
    .plus(claimablePriceImpactUsd);
  const dispTotalClaimable = truncateFormat(
    totalClaimable,
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
    },
  );

  const dispTotalClaimed = truncateFormat(
    totalClaimed,
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
    },
  );
  return (
    <div className="flex gap-2 px-2 pt-2">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col gap-1">
          <TotalClaimableText
            fundingFeeUsd={claimableFundingFeeUsd}
            priceImpactUsd={claimablePriceImpactUsd}
          />
          <span className="text-t-1100 text-xl font-medium">
            {dispTotalClaimable}
          </span>
        </div>
        {/* <ClaimAllButton
          count={claimableCount}
          hasTxHash={false}
          claimedUsd={totalClaimable.toFixed()}
        /> */}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-t-270 text-xs">{t`Total Claimed`}</span>
        <span className="text-t-1100 text-xl font-medium">
          {dispTotalClaimed}
        </span>
      </div>
    </div>
  );
};

export default Summary;
