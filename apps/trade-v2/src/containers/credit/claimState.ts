import type { CreditWindowStatus } from './types';

export type ClaimButtonLabel = 'claim' | 'claimed' | 'claiming';

export interface ClaimActionState {
  isClaiming?: boolean;
}

interface ClaimButtonState {
  disabled: boolean;
  label: ClaimButtonLabel;
}

interface CreditClaimStateInput {
  windowStatus: CreditWindowStatus;
  creditClaimed: boolean;
  hzflClaimed: boolean;
  hzflEnabled: boolean;
  hasCreditAmount: boolean;
  hasHzflAmount: boolean;
  creditAction?: ClaimActionState;
  tokenAction?: ClaimActionState;
}

export const hasPositiveRawAmount = (value: string) => {
  try {
    return BigInt(value) > 0n;
  } catch {
    return false;
  }
};

export const getCreditWindowStatus = ({
  startAt,
  endAt,
  now = Date.now(),
}: {
  startAt: number;
  endAt: number;
  now?: number;
}): CreditWindowStatus => {
  if (now < startAt) return 'pending';
  if (now >= endAt) return 'closed';
  return 'open';
};

const getClaimButtonState = ({
  windowStatus,
  claimed,
  hasAmount,
  enabled = true,
  action,
}: {
  windowStatus: CreditWindowStatus;
  claimed: boolean;
  hasAmount: boolean;
  enabled?: boolean;
  action?: ClaimActionState;
}): ClaimButtonState => ({
  disabled:
    windowStatus !== 'open' ||
    claimed ||
    !hasAmount ||
    !enabled ||
    !!action?.isClaiming,
  label: action?.isClaiming ? 'claiming' : claimed ? 'claimed' : 'claim',
});

export const getCreditClaimState = ({
  windowStatus,
  creditClaimed,
  hzflClaimed,
  hzflEnabled,
  hasCreditAmount,
  hasHzflAmount,
  creditAction,
  tokenAction,
}: CreditClaimStateInput) => ({
  periodEnded: windowStatus === 'closed',
  credit: getClaimButtonState({
    windowStatus,
    claimed: creditClaimed,
    hasAmount: hasCreditAmount,
    action: creditAction,
  }),
  token: getClaimButtonState({
    windowStatus,
    claimed: hzflClaimed,
    hasAmount: hasHzflAmount,
    enabled: hzflEnabled,
    action: tokenAction,
  }),
});
