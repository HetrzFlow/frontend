export interface CreditSeason {
  seasonId: string;
  seasonName: string;
  status?: 'active' | 'upcoming' | 'ended';
  startAt?: string;
  endAt?: string;
}

export type CreditWindowStatus = 'pending' | 'open' | 'closed';

export interface CreditAirdrop {
  seasonId: string;
  seasonName: string;
  creditAmount: string;
  creditEarnedAmount?: string;
  pointsAmount?: string;
  hzflAmount: string;
  hasCreditAmount: boolean;
  hasHzflAmount: boolean;
  windowOpenAt: string;
  windowCloseAt: string;
  windowStatus: CreditWindowStatus;
  creditClaimed: boolean;
  hzflClaimed: boolean;
  hzflEnabled: boolean;
}

export interface CreditAirdropShareReferralStats {
  referredUsers: string;
  referredVolume: string;
}

export interface CreditBalance {
  currentBalance: string;
  consumedCredit: string;
  realizedProfits: string;
  realizedFeeRebate: string;
  accumulatedFeeRebate: string;
  maxFeeRebate: string;
  totalCreditAllocated: string;
  totalHzflAllocated: string;
}
