import { useLingui } from '@lingui/react/macro';
import { truncateFormat } from '@repo/lib/format';
import {
  InfoCircleIcon,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { useGlobalStore } from '@/common';

interface TotalClaimableTextProps {
  fundingFeeUsd?: string;
  priceImpactUsd?: string;
}

const TotalClaimableText = ({
  fundingFeeUsd,
  priceImpactUsd,
}: TotalClaimableTextProps) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  return (
    <div className="text-t-270 flex gap-1 text-xs">
      {t`Total Claimable`}

      <Tooltip>
        <TooltipTrigger>
          <InfoCircleIcon size={14} className="text-t-350 hover:text-t-1100" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-80" collisionPadding={16}>
          <div className="flex flex-col gap-1">
            <p className="text-t-270">
              {t`Claimable funding fees accrue from market balance incentives,and price impact rebates are excess cost refunds held for protocol safety.`}
            </p>
            <Separator className="my-1" />
            {!!fundingFeeUsd && (
              <div className="flex items-center justify-between">
                <span className="text-t-1100">{t`Claimable Funding Fee`}</span>
                <span className="text-accent">
                  {truncateFormat(fundingFeeUsd, usdAmountDisplayDecimal, {
                    style: 'currency',
                    currency: 'USD',
                    showMinDecimalValue: true,
                    stripTrailingZeros: true,
                  })}
                </span>
              </div>
            )}
            {!!priceImpactUsd && (
              <div className="flex items-center justify-between">
                <span className="text-t-1100">{t`Claimable Price Impact`}</span>
                <span className="text-accent">
                  {truncateFormat(priceImpactUsd, usdAmountDisplayDecimal, {
                    style: 'currency',
                    currency: 'USD',
                    showMinDecimalValue: true,
                    stripTrailingZeros: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default TotalClaimableText;
