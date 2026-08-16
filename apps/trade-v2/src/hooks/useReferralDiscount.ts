import { calc } from '@repo/lib/calc';
import { CONTRACT_PRECISION_MULTIPLIER } from '@/common/constants';
import { useUserReferralInfo } from '@/services/rest/referral';

const useBoundReferralCode = () => {
  const query = useUserReferralInfo();

  return {
    ...query,
    data: query.isSuccess ? query.data?.userReferralCodeString : undefined,
  };
};

export const useHasBoundReferralCode = () => {
  const query = useBoundReferralCode();

  return {
    ...query,
    data: query.isSuccess ? !!query.data : undefined,
  };
};

export const useReferralDiscountRate = () => {
  const query = useUserReferralInfo();

  return {
    ...query,
    data: query.data
      ? calc(query.data.discountFactor.toString())
          .div(CONTRACT_PRECISION_MULTIPLIER)
          .toFixed()
      : '0',
  };
};
