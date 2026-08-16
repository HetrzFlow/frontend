import { calc } from '@repo/lib/calc';

export function getEffectiveReferralDiscountRate({
  isCreditMarket,
  referralDiscountRate,
}: {
  isCreditMarket: boolean;
  referralDiscountRate: string;
}) {
  return isCreditMarket ? '0' : referralDiscountRate;
}

export function getEffectiveReferralDiscountUsd({
  isCreditMarket,
  feeUsd,
  referralDiscountRate,
}: {
  isCreditMarket: boolean;
  feeUsd: string | number;
  referralDiscountRate: string;
}) {
  return calc(feeUsd || 0)
    .times(
      getEffectiveReferralDiscountRate({
        isCreditMarket,
        referralDiscountRate,
      }),
    )
    .toFixed();
}
