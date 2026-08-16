'use client';

import { useMemo } from 'react';
import { abis } from '@hertzflow/sdk-v2/abis/index';
import { getContract } from '@hertzflow/sdk-v2/configs/contracts';
import { encodeReferralCode } from '@hertzflow/sdk-v2/utils/referral';
import { zeroAddress, zeroHash } from 'viem';
import { useQuery } from '@repo/lib/queryClient';
import { useHzSdk } from '@/common';
import {
  REFERRAL_CODE_LENGTH,
  isValidReferralCode,
  normalizeReferralCode,
} from '@/containers/referral/referralCodeValidation';

export const useCodeOwner = (
  code: string,
  { enabled: ownerLookupEnabled = true }: { enabled?: boolean } = {},
) => {
  const hzSdk = useHzSdk();
  const normalizedCode = useMemo(() => normalizeReferralCode(code), [code]);
  const enabled =
    ownerLookupEnabled &&
    !!hzSdk &&
    normalizedCode.length === REFERRAL_CODE_LENGTH &&
    isValidReferralCode(normalizedCode);

  return useQuery<string | null>({
    queryKey: ['referral-code-owner', hzSdk?.chainId, normalizedCode],
    enabled,
    queryFn: async () => {
      const encodedCode = encodeReferralCode(normalizedCode);
      if (encodedCode === zeroHash) {
        return null;
      }

      const owner = await hzSdk!.publicClient.readContract({
        address: getContract(
          hzSdk!.chainId,
          'ReferralStorage',
        ) as `0x${string}`,
        abi: abis.ReferralStorage,
        functionName: 'codeOwners',
        args: [encodedCode],
      });

      return owner && owner !== zeroAddress ? owner : null;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
};
