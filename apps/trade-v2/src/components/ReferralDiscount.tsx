import { ReactNode } from 'react';

import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import { CreditIcon, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

const formatUsd = ({
  value,
  displayDecimals,
  negative,
}: {
  value: string;
  displayDecimals: number;
  negative?: boolean;
}) => {
  return truncateFormat(
    calc(value || 0).times(negative ? -1 : 1),
    displayDecimals,
    {
      style: 'currency',
      currency: 'USD',
      signDisplay: negative ? 'always' : 'auto',
      showNegativeZero: true,
    },
  );
};

export const getDiscountedTradingFee = (fee: string, discountRate: string) =>
  calc(fee || 0)
    .times(calc(1).minus(discountRate || 0))
    .toFixed();

export const ReferralDiscountBadge = ({
  discountRate,
}: {
  discountRate: string;
}) => {
  const discountDisplay = percentFormat(discountRate, 0);

  return (
    <span className="text-accent bg-accent/15 flex h-3.5 items-center justify-center rounded-xs px-1 text-[10px]/tight">
      {discountDisplay} OFF
    </span>
  );
};

export const ReferralDiscountLabel = ({
  children,
  discountRate,
}: {
  children: ReactNode;
  discountRate: string;
}) => {
  return (
    <span className="flex items-center gap-1">
      <span>{children}</span>
      <ReferralDiscountBadge discountRate={discountRate} />
    </span>
  );
};

export const ReferralHistoryFee = ({
  actualFee,
  originalFee,
  discountApplied,
  displayDecimals,
  discountRate,
  showCreditMarker = false,
}: {
  actualFee: string;
  originalFee: string;
  discountApplied: boolean;
  displayDecimals: number;
  discountRate?: string;
  showCreditMarker?: boolean;
}) => {
  const { t } = useLingui();
  const actualDisplay = formatUsd({
    value: actualFee,
    displayDecimals,
  });
  const originalDisplay = formatUsd({
    value: originalFee,
    displayDecimals,
  });

  if (!discountApplied) {
    return (
      <span className="font-plex block w-20 text-xs">
        {showCreditMarker ? (
          <span className="inline-flex items-center gap-1">
            <CreditIcon size={12} className="text-accent" />
            {actualDisplay}
          </span>
        ) : (
          actualDisplay
        )}
      </span>
    );
  }

  return (
    <div className="font-plex flex w-max flex-col items-start justify-center gap-0.5 max-md:flex-row-reverse max-md:items-center max-md:gap-1">
      <Tooltip>
        <TooltipTrigger className="text-accent w-max text-left text-xs underline decoration-dotted underline-offset-2">
          {showCreditMarker ? (
            <span className="inline-flex items-center gap-1">
              <CreditIcon size={12} className="text-accent" />
              {actualDisplay}
            </span>
          ) : (
            actualDisplay
          )}
        </TooltipTrigger>
        <TooltipContent className="text-t-1100 w-max">
          {discountRate
            ? `${percentFormat(discountRate, 0)} ${t`discount`}`
            : t`Referral discount applied`}
        </TooltipContent>
      </Tooltip>
      <span className="text-t-430 text-[10px]/tight line-through max-md:text-xs">
        {originalDisplay}
      </span>
    </div>
  );
};
