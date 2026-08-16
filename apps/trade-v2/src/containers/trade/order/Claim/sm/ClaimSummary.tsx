import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useGlobalStore } from '@/common';
import TotalClaimableText from '../components/TotalClaimableText';
import { useClaimStore } from '../store';

interface ClaimSummaryProps {
  totalClaimed: string;
}

const ClaimSummary: FC<ClaimSummaryProps> = ({ totalClaimed }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [claimableFundingFeeUsd, claimablePriceImpactUsd] = useClaimStore(
    useShallow((state) => [
      state.claimableFundingFeeUsd,
      state.claimablePriceImpactUsd,
    ]),
  );

  const totalClaimable = calc(claimableFundingFeeUsd)
    .plus(claimablePriceImpactUsd);

  return (
    <div className="flex gap-2">
      <div className="flex w-1/2 items-center justify-between">
        <div className="flex flex-col gap-1">
          <TotalClaimableText
            fundingFeeUsd={claimableFundingFeeUsd}
            priceImpactUsd={claimablePriceImpactUsd}
          />
          <span className="text-t-1100 text-xl font-medium">
            {truncateFormat(totalClaimable, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
            })}
          </span>
        </div>
      </div>
      <div className="flex w-1/2 flex-col gap-1">
        <span className="text-t-270 text-xs">{t`Total Claimed`}</span>
        <span className="text-t-1100 text-xl font-medium">
          {truncateFormat(totalClaimed, usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
            showMinDecimalValue: true,
          })}
        </span>
      </div>
    </div>
  );
};

export default ClaimSummary;
