'use client';

import { useCallback, useMemo } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useCurrentAccountAddress } from '@/common/chainClient';
import {
  REFERRAL_CODE_LENGTH,
  isValidReferralCode,
  normalizeReferralCode,
} from '@/containers/referral/referralCodeValidation';
import { useCodeOwner } from '@/hooks/useReferralQueries';

export type ReferralCodeValidationMode = 'bind' | 'create' | 'change';

export type ReferralCodeValidationReason =
  | 'invalid_format'
  | 'code_taken'
  | 'code_not_found'
  | 'self_referral'
  | 'code_already_applied'
  | null;

type ReferralCodeValidationState = {
  normalizedCode: string;
  isComplete: boolean;
  isChecking: boolean;
  isCodeTaken: boolean;
  isSelfReferral: boolean;
  canSubmit: boolean;
  hasError: boolean;
  reason: ReferralCodeValidationReason;
  errorMessage: string | null;
};

const PURE_DIGITS_PATTERN = /^[0-9]+$/;

const getErrorMessage = (reason: ReferralCodeValidationReason) => {
  switch (reason) {
    case 'invalid_format':
      return i18n._(
        msg`Can not be all digits. Please include at least one letter.`,
      );
    case 'code_taken':
      return i18n._(msg`Code already taken. Please try another one.`);
    case 'code_not_found':
      return i18n._(msg`Code invalid. Please try another one.`);
    case 'self_referral':
      return i18n._(msg`You can not refer yourself. Please try another one.`);
    case 'code_already_applied':
      return i18n._(msg`Code already bound.`);
    default:
      return null;
  }
};

export const useReferralCodeValidation = ({
  code,
  mode,
  currentBoundCode,
  skipOwnerValidation = false,
}: {
  code: string;
  mode: ReferralCodeValidationMode;
  currentBoundCode?: string;
  skipOwnerValidation?: boolean;
}) => {
  const accountAddress = useCurrentAccountAddress();
  const requiresExistingCode = mode === 'bind' || mode === 'change';
  const normalizedCode = useMemo(() => normalizeReferralCode(code), [code]);
  const normalizedBoundCode = useMemo(
    () => (currentBoundCode ? normalizeReferralCode(currentBoundCode) : ''),
    [currentBoundCode],
  );
  const {
    data: codeOwner,
    isLoading,
    isFetching,
    refetch,
  } = useCodeOwner(normalizedCode, { enabled: !skipOwnerValidation });

  const buildState = useCallback(
    (
      ownerAddress: string | null | undefined,
      isChecking: boolean,
    ): ReferralCodeValidationState => {
      const isComplete = normalizedCode.length === REFERRAL_CODE_LENGTH;
      const isOwnerValidationPaused = skipOwnerValidation && isComplete;
      const isPureDigits = isComplete && PURE_DIGITS_PATTERN.test(normalizedCode);
      const isCodeTaken = !!ownerAddress;
      const isSelfReferral =
        requiresExistingCode &&
        !!accountAddress &&
        !!ownerAddress &&
        ownerAddress.toLowerCase() === accountAddress.toLowerCase();
      const isAlreadyApplied =
        mode === 'change' &&
        isComplete &&
        !!normalizedBoundCode &&
        normalizedCode === normalizedBoundCode;

      let reason: ReferralCodeValidationReason = null;

      if (isPureDigits) {
        reason = 'invalid_format';
      } else if (isAlreadyApplied) {
        reason = 'code_already_applied';
      } else if (isComplete && !isChecking && !isOwnerValidationPaused) {
        if (mode === 'create' && isCodeTaken) {
          reason = 'code_taken';
        }

        if (requiresExistingCode) {
          if (!isCodeTaken) {
            reason = 'code_not_found';
          } else if (isSelfReferral) {
            reason = 'self_referral';
          }
        }
      }

      const isValidFormat = isValidReferralCode(normalizedCode);
      const canSubmit =
        !isOwnerValidationPaused &&
        !isChecking &&
        !reason &&
        isValidFormat &&
        ((mode === 'create' && !isCodeTaken) ||
          (requiresExistingCode && isCodeTaken));

      return {
        normalizedCode,
        isComplete,
        isChecking,
        isCodeTaken,
        isSelfReferral,
        canSubmit,
        hasError: !!reason,
        reason,
        errorMessage: getErrorMessage(reason),
      };
    },
    [
      accountAddress,
      mode,
      normalizedBoundCode,
      normalizedCode,
      requiresExistingCode,
      skipOwnerValidation,
    ],
  );

  const isChecking =
    !skipOwnerValidation && (isLoading || isFetching);
  const state = buildState(codeOwner, isChecking);

  const validateLatest = useCallback(async () => {
    if (skipOwnerValidation) {
      return buildState(undefined, false);
    }

    const result = await refetch();
    if (result.isError) {
      return buildState(undefined, false);
    }

    const latestCodeOwner = result.data;
    return buildState(latestCodeOwner, false);
  }, [buildState, refetch, skipOwnerValidation]);

  return {
    ...state,
    refetch: validateLatest,
  };
};
