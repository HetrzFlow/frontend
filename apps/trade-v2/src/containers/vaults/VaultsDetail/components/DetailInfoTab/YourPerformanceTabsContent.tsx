import { useMemo } from 'react';
import { UserPerformanceCards } from '@/components/UserPerformanceCards';
import { HZV_NAME } from '@/stores/pools/trade';
import {
  calculateDepositCostBasisUsd,
  calculateVaultRestHoldingsUsd,
  getVaultListItem,
  parseRawValue,
  useVaultDetailData,
  useVaultsListData,
} from '@/stores/synthetics/marketsData/selectors';
import { useVaultUserPerformance } from '@/stores/synthetics/userPerformance/selectors';

type YourPerformanceTabsContentProps = {
  vaultAddress: string;
};

export default function YourPerformanceTabsContent({
  vaultAddress,
}: YourPerformanceTabsContentProps) {
  const performance = useVaultUserPerformance(vaultAddress);
  const vaultsList = useVaultsListData();
  const vaultDetail = useVaultDetailData(vaultAddress);
  const vaultListItem = useMemo(
    () => getVaultListItem(vaultsList, vaultAddress),
    [vaultAddress, vaultsList],
  );
  const realizedPnl = useMemo(
    () => parseRawValue(vaultListItem?.realized_pnl),
    [vaultListItem?.realized_pnl],
  );
  const unrealizedPnl = useMemo(
    () => parseRawValue(vaultListItem?.unrealized_pnl),
    [vaultListItem?.unrealized_pnl],
  );
  const totalPnl = useMemo(() => {
    if (realizedPnl === undefined && unrealizedPnl === undefined) {
      return undefined;
    }
    return (realizedPnl ?? 0n) + (unrealizedPnl ?? 0n);
  }, [realizedPnl, unrealizedPnl]);
  const positionUsd = useMemo(
    () => calculateVaultRestHoldingsUsd(vaultListItem),
    [vaultListItem],
  );
  const positionAmount = useMemo(
    () => parseRawValue(vaultListItem?.tokens_balance),
    [vaultListItem?.tokens_balance],
  );
  const unrealizedPnlBasis = useMemo(
    () =>
      calculateDepositCostBasisUsd({
        average_deposit_price: vaultDetail?.average_deposit_price,
        tokens_balance: vaultListItem?.tokens_balance ?? vaultDetail?.tokens_balance,
      }),
    [
      vaultDetail?.average_deposit_price,
      vaultDetail?.tokens_balance,
      vaultListItem?.tokens_balance,
    ],
  );

  return (
    <UserPerformanceCards
      shouldShowEmptyState={!performance?.isLoading && !performance?.hasDeposit}
      resourceType="vault"
      positionUsd={positionUsd}
      positionAmount={positionAmount}
      positionSymbol={HZV_NAME}
      totalPnl={totalPnl}
      unrealizedPnl={unrealizedPnl}
      totalBought={performance?.totalBought}
      unrealizedPnlBasis={unrealizedPnlBasis}
    />
  );
}
