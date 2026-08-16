'use client';

export type UserPerformanceResourceType = 'vault' | 'pool';

export type UserPerformanceEntry = {
  resourceType: UserPerformanceResourceType;
  resourceAddress: string;
  walletAddress?: string;
  isLoading: boolean;
  hasDeposit: boolean;
  depositsUsd?: bigint;
  earnedFeesUsd?: bigint;
  realizedPnl?: bigint;
  unrealizedPnl?: bigint;
  allTimePnl?: bigint;
  averageDepositPrice?: bigint;
  totalBought?: bigint;
  currentLpPrice?: bigint;
  currentLpBalance?: bigint;
};
