import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Loading, ScrollBox } from '@repo/ui';

import { useOpenOrders, usePositions } from '@/common/services';
import { SHOW_LP_PENDING_ORDERS } from '@/constants/common';
import { usePendingLiquidityOrders } from '@/containers/pools/PoolsDetail/components/ActivityPanel/PendingOrdersList';
import { ActivityTabType } from '@/containers/pools/PoolsDetail/components/ActivityPanel/types';
import { usePoolsList } from '@/queries/bsc/pools';
import { useClaimableFundingFees, useClaimStats } from '@/services/rest/claim';
import { CATEGORY } from '@/services/rest/pools';
import { useVaultsListDataProvider } from '@/stores/synthetics/marketsData/provider';
import { useVaultsOverviewList } from '@/stores/synthetics/marketsData/selectors';
import Claimable from './Claimable';
import PendingLiquidityOrders from './PendingLiquidityOrders';
import PerpOrders from './PerpOrders';
import Pools from './Pools';
import Positions from './Positions';
import Vaults from './Vaults';

const Portfolia = () => {
  const { t } = useLingui();
  const { data: orders, isLoading: ordersIsLoading } = useOpenOrders();
  const { data: positions, isLoading: positionsIsLoading } = usePositions();
  const { data: poolsListData, isLoading: poolsIsLoading } = usePoolsList({
    category: CATEGORY.all,
    inWallet: true,
    pageSize: 100,
    enabled: true,
  });
  const { data: claimableFundingFees, isLoading: claimableFeesIsLoading } =
    useClaimableFundingFees();
  const { data: claimStats, isLoading: claimStatsIsLoading } = useClaimStats();
  useVaultsListDataProvider();
  const vaultsList = useVaultsOverviewList();
  const vaultsIsLoading = vaultsList === undefined;
  const pendingPoolOrdersQuery = usePendingLiquidityOrders({
    type: ActivityTabType.POOL,
    enabled: SHOW_LP_PENDING_ORDERS,
  });
  const pendingVaultOrdersQuery = usePendingLiquidityOrders({
    type: ActivityTabType.VAULT,
    enabled: SHOW_LP_PENDING_ORDERS,
  });

  const isPendingOrdersLoading = SHOW_LP_PENDING_ORDERS && (
    pendingPoolOrdersQuery.isLoading || pendingVaultOrdersQuery.isLoading
  );
  const isLoading =
    (ordersIsLoading &&
      positionsIsLoading &&
      poolsIsLoading &&
      vaultsIsLoading &&
      claimableFeesIsLoading &&
      claimStatsIsLoading) ||
    isPendingOrdersLoading;

  const hasPoolDeposit = poolsListData?.pools?.some((p) => {
    try {
      return BigInt(p.tokens_balance ?? '0') > 0n;
    } catch {
      return false;
    }
  });
  const hasVaultDeposit = vaultsList?.some((v) => {
    try {
      return BigInt(v.tokens_balance ?? '0') > 0n;
    } catch {
      return false;
    }
  });
  const hasClaimable =
    !!claimableFundingFees?.length ||
    !!claimStats?.claimablePriceImpact?.length;
  const hasPendingOrders = SHOW_LP_PENDING_ORDERS && (
    !!pendingPoolOrdersQuery.data?.length ||
    !!pendingVaultOrdersQuery.data?.length
  );

  const isEmpty =
    !orders?.length &&
    !positions?.length &&
    !hasPoolDeposit &&
    !hasVaultDeposit &&
    !hasClaimable &&
    !hasPendingOrders;

  return (
    <ScrollBox
      shadowClassName="to-bg-drawer-shadow max-md:to-popover max-md:hidden absolute bottom-0 mx-4 max-md:mx-4 h-12 w-[calc(100%-calc(var(--spacing)*8))] bg-gradient-to-b from-transparent"
      scrollClassName="scrollbar-none relative flex max-md:h-auto max-md:!overflow-y-visible h-[calc(100dvh-380px)] flex-col gap-[12px] overflow-y-auto px-4 pb-4"
    >
      {isLoading ? (
        <Loading className="h-20" />
      ) : isEmpty ? (
        <div className="text-t-430 mt-2 text-center text-sm">
          {t`No open positions found.`}
        </div>
      ) : (
        <>
          <Positions />
          <PerpOrders />
          <Claimable />
          <Pools />
          {SHOW_LP_PENDING_ORDERS ? (
            <PendingLiquidityOrders
              type={ActivityTabType.POOL}
              ordersQuery={pendingPoolOrdersQuery}
            />
          ) : null}
          <Vaults />
          {SHOW_LP_PENDING_ORDERS ? (
            <PendingLiquidityOrders
              type={ActivityTabType.VAULT}
              ordersQuery={pendingVaultOrdersQuery}
            />
          ) : null}
        </>
      )}
    </ScrollBox>
  );
};

export default memo(Portfolia);
