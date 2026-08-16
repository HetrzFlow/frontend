'use client';

import { useMemo } from 'react';
import { useConnectionStatus } from '@/common/chainClient/hooks';
import { UserPerformanceCards } from '@/components/UserPerformanceCards';
import { usePoolDetail } from '@/queries/bsc/pools';
import { HZLP_NAME } from '@/stores/pools/trade';
import {
  calculateDepositCostBasisUsd,
  calculatePoolRestHoldingsUsd,
  parseRawValue,
} from '@/stores/synthetics/marketsData/selectors';

type YourPerformanceTabsContentProps = {
  marketAddress: string;
};

export default function YourPerformanceTabsContent({
  marketAddress,
}: YourPerformanceTabsContentProps) {
  const connectionStatus = useConnectionStatus();
  const { data: poolDetail } = usePoolDetail(marketAddress);
  const pool = poolDetail?.pool;
  const realizedPnl = useMemo(
    () => parseRawValue(pool?.realized_pnl),
    [pool?.realized_pnl],
  );
  const unrealizedPnl = useMemo(
    () => parseRawValue(pool?.unrealized_pnl),
    [pool?.unrealized_pnl],
  );
  const totalPnl = useMemo(() => {
    if (realizedPnl === undefined && unrealizedPnl === undefined) {
      return undefined;
    }
    return (realizedPnl ?? 0n) + (unrealizedPnl ?? 0n);
  }, [realizedPnl, unrealizedPnl]);
  const totalBought = useMemo(
    () => parseRawValue(pool?.total_bought),
    [pool?.total_bought],
  );
  const unrealizedPnlBasis = useMemo(
    () => calculateDepositCostBasisUsd(pool),
    [pool],
  );
  const positionUsd = useMemo(
    () => calculatePoolRestHoldingsUsd(pool),
    [pool],
  );
  const positionAmount = useMemo(
    () => parseRawValue(pool?.tokens_balance),
    [pool?.tokens_balance],
  );
  const hasDeposit = useMemo(() => {
    if (connectionStatus === 'disconnected') return false;
    const tokensBalance = parseRawValue(pool?.tokens_balance);
    return (
      (tokensBalance !== undefined && tokensBalance > 0n) ||
      (totalBought !== undefined && totalBought > 0n)
    );
  }, [connectionStatus, pool?.tokens_balance, totalBought]);
  return (
    <UserPerformanceCards
      shouldShowEmptyState={!hasDeposit}
      resourceType="pool"
      positionUsd={positionUsd}
      positionAmount={positionAmount}
      positionSymbol={HZLP_NAME}
      totalPnl={totalPnl}
      unrealizedPnl={unrealizedPnl}
      totalBought={totalBought}
      unrealizedPnlBasis={unrealizedPnlBasis}
    />
  );
}
