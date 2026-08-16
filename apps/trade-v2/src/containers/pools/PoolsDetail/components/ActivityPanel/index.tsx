import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { usePathname } from 'next/navigation';
import { Trans } from '@lingui/react/macro';
import { thoFormat } from '@repo/lib/format';
import {
  ChevronDownIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui';
import {
  TradeTabs,
  useConnectionStatus,
  useCurrentAccountAddress,
} from '@/common';
import {
  LIQUIDITY_HISTORY_REFRESH_EVENT,
  type LiquidityHistoryRefreshEventDetail,
} from '@/common/constants/events';
import { useHydrated } from '@/common/hooks/useHydrated';
import { getLiquidityHistoryDetails } from '@/common/utils/liquidityHistory';
import ModuleCard from '@/components/ModuleCard';
import { SHOW_LP_PENDING_ORDERS } from '@/constants/common';
import { usePoolHistoryData } from '@/queries/bsc/pools';
import { useVaultHistory } from '@/queries/bsc/vaults';
import { HistoryStatus, type HistoryItem } from '@/services/rest/pools';
import { LiqTradeType } from '@/stores/pools/trade';
import ActivityCardList from './ActivityCardList';
import ActivityList from './ActivityList';
import PendingOrdersList, {
  usePendingLiquidityOrders,
} from './PendingOrdersList';
import ActivityPanelSkeleton from './Skeleton';
import {
  ActionFilter,
  ActivityTabType,
  getActionFilterOptions,
  ModeType,
} from './types';

export { ActionFilter, ActivityTabType, ModeType } from './types';

enum PoolsActivityTabType {
  MY = 'My Activity',
  PENDING = 'My Pending',
  POOL = 'Pool Activity',
}

enum VaultsActivityTabType {
  MY = 'My Activity',
  PENDING = 'My Pending',
  VAULT = 'Vault Activity',
}

const ACTIVITY_PAGE_SIZE = 8;
const POST_TRADE_REFRESH_INTERVAL_MS = 3_000;
const POST_TRADE_REFRESH_REPEAT_COUNT = 3;
const FIRST_DEPOSIT_RECEIVER_ADDRESS =
  '0x0000000000000000000000000000000000000001';
interface ActivityPanelProps {
  type: ActivityTabType;
  marketAddress: string;
  disableMaxHeight?: boolean;
  fitContentHeight?: boolean;
  layout?: 'table' | 'card';
  disableAnimation?: boolean;
  className?: string;
  disableMobileCard?: boolean;
}

interface ActivityPanelListProps {
  layout: 'card' | 'table';
  type: ActivityTabType;
  mode: ModeType;
  items: HistoryItem[];
  loading: boolean;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
  showActionFilter?: boolean;
  pagination: {
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean | undefined;
    fetchNextPage: (() => void) | undefined;
  };
}

const hasDetails = (item: HistoryItem) =>
  (getLiquidityHistoryDetails(item)?.length ?? 0) > 1;

const isFirstDepositReceiverItem = (item: HistoryItem) =>
  item.action === LiqTradeType.Deposit &&
  item.wallet_address?.toLowerCase() === FIRST_DEPOSIT_RECEIVER_ADDRESS;

const filterHistoryItems = (
  pages: Array<{ actions?: HistoryItem[] }> | undefined,
  includePending: boolean,
) => {
  if (!pages) return [];
  return pages.flatMap((page) =>
    (page.actions ?? []).flatMap((a) => {
      if (isFirstDepositReceiverItem(a)) return [];

      const shouldInclude =
        a.status === HistoryStatus.Cancelled ||
        hasDetails(a) ||
        (includePending
          ? a.status === HistoryStatus.Success ||
            a.status === HistoryStatus.Pending
          : a.status === HistoryStatus.Success);

      return shouldInclude ? [a] : [];
    }),
  );
};

const getHistoryAction = (filter: ActionFilter) => {
  if (filter === ActionFilter.DEPOSITS) return 'deposit';
  if (filter === ActionFilter.WITHDRAWALS) return 'withdraw';
  if (filter === ActionFilter.CANCELLED_DEPOSITS) return 'cancelled_deposit';
  if (filter === ActionFilter.CANCELLED_WITHDRAWALS)
    return 'cancelled_withdraw';
  return undefined;
};

const ActivityPanelList = ({
  layout,
  type,
  mode,
  items,
  loading,
  scrollRootRef,
  actionFilter,
  onActionFilterChange,
  showActionFilter,
  pagination,
}: ActivityPanelListProps) => {
  if (layout === 'card') {
    return (
      <ActivityCardList
        type={type}
        mode={mode}
        items={items}
        isInitialLoading={loading}
        scrollRootRef={scrollRootRef}
        actionFilter={actionFilter}
        onActionFilterChange={onActionFilterChange}
        showActionFilter={showActionFilter}
        hasNextPage={pagination.hasNextPage}
        isFetchingNextPage={pagination.isFetchingNextPage}
        fetchNextPage={pagination.fetchNextPage}
      />
    );
  }

  return (
    <ActivityList
      mode={mode}
      items={items}
      isInitialLoading={loading}
      scrollRootRef={scrollRootRef}
      actionFilter={actionFilter}
      onActionFilterChange={onActionFilterChange}
      hasNextPage={pagination.hasNextPage}
      isFetchingNextPage={pagination.isFetchingNextPage}
      fetchNextPage={pagination.fetchNextPage}
    />
  );
};

type ActivityPagination = ActivityPanelListProps['pagination'];

interface ActivityPanelTabsProps {
  type: ActivityTabType;
  value: PoolsActivityTabType | VaultsActivityTabType;
  onValueChange: (value: string) => void;
  disableAnimation: boolean;
  contentWrapClassName: string;
  layout: 'card' | 'table';
  itemsMy: HistoryItem[];
  itemsAll: HistoryItem[];
  loadingMy: boolean;
  loadingAll: boolean;
  myPagination: ActivityPagination;
  allPagination: ActivityPagination;
  myActionFilter: ActionFilter;
  pendingActionFilter: ActionFilter;
  allActionFilter: ActionFilter;
  onMyActionFilterChange: (filter: ActionFilter) => void;
  onPendingActionFilterChange: (filter: ActionFilter) => void;
  onAllActionFilterChange: (filter: ActionFilter) => void;
  pendingOrdersQuery: ReturnType<typeof usePendingLiquidityOrders>;
}

const getListWrapperClassName = (hasRows: boolean) =>
  hasRows ? 'max-h-60 overflow-y-auto' : 'h-60 overflow-y-auto';

const ACTION_FILTER_LABEL: Record<ActionFilter, ReactNode> = {
  [ActionFilter.ALL]: <Trans>All</Trans>,
  [ActionFilter.DEPOSITS]: (
    <Trans context="Liquidity action filter">Deposits</Trans>
  ),
  [ActionFilter.WITHDRAWALS]: (
    <Trans context="Liquidity action filter">Withdrawals</Trans>
  ),
  [ActionFilter.CANCELLED_DEPOSITS]: <Trans>Cancelled Deposits</Trans>,
  [ActionFilter.CANCELLED_WITHDRAWALS]: <Trans>Cancelled Withdrawals</Trans>,
};

function MobileActionFilter({
  value,
  onChange,
  includeCancelled,
}: {
  value: ActionFilter;
  onChange: (filter: ActionFilter) => void;
  includeCancelled: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-bg-3 text-t-1100 flex h-8 w-fit min-w-[105px] shrink-0 items-center justify-between gap-2 rounded-xl px-4 text-xs font-medium">
        <span className="whitespace-nowrap">{ACTION_FILTER_LABEL[value]}</span>
        <ChevronDownIcon size={16} className="text-t-1100 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-bg-3 w-max min-w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        {getActionFilterOptions(includeCancelled).map((filter) => (
          <DropdownMenuItem
            key={filter}
            className="text-t-1100 focus:bg-bg-4 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap"
            onSelect={() => onChange(filter)}
          >
            {ACTION_FILTER_LABEL[filter]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ActivityPanelTabs = memo(function ActivityPanelTabs({
  type,
  value,
  onValueChange,
  disableAnimation,
  contentWrapClassName,
  layout,
  itemsMy,
  itemsAll,
  loadingMy,
  loadingAll,
  myPagination,
  allPagination,
  myActionFilter,
  pendingActionFilter,
  allActionFilter,
  onMyActionFilterChange,
  onPendingActionFilterChange,
  onAllActionFilterChange,
  pendingOrdersQuery,
}: ActivityPanelTabsProps) {
  const isPool = type === ActivityTabType.POOL;
  const hasPendingOrders =
    SHOW_LP_PENDING_ORDERS && Boolean(pendingOrdersQuery.data?.length);
  const showPendingTab = hasPendingOrders;
  const myScrollRootRef = useRef<HTMLDivElement | null>(null);
  const allScrollRootRef = useRef<HTMLDivElement | null>(null);
  const isMyValue = isPool
    ? value === PoolsActivityTabType.MY
    : value === VaultsActivityTabType.MY;
  const isPendingValue = isPool
    ? value === PoolsActivityTabType.PENDING
    : value === VaultsActivityTabType.PENDING;
  const actionFilter = isPendingValue
    ? pendingActionFilter
    : isMyValue
      ? myActionFilter
      : allActionFilter;
  const onActionFilterChange = isPendingValue
    ? onPendingActionFilterChange
    : isMyValue
      ? onMyActionFilterChange
      : onAllActionFilterChange;

  return (
    <TradeTabs
      className="flex h-full min-h-0 flex-col gap-3"
      value={value}
      onValueChange={onValueChange}
      disableAnimation={disableAnimation}
      listLayoutClassName="flex"
      horizontalContentClassName={layout === 'card' ? 'gap-2' : undefined}
      sideContent={
        layout === 'card' ? (
          <MobileActionFilter
            value={actionFilter}
            onChange={onActionFilterChange}
            includeCancelled={!isPendingValue && SHOW_LP_PENDING_ORDERS}
          />
        ) : undefined
      }
      listClassName="gap-1 justify-start shrink-0 relative"
      activeBarClassName="bg-bg-3 rounded-lg"
      labelClassName="h-auto flex-none grow-0 rounded-lg px-3 py-1.5 text-xs data-[state=active]:text-t-1100"
      contentWrapClassName={contentWrapClassName}
      contentClassName="min-h-0 flex flex-col"
      animationClassName="min-h-0 flex flex-col"
      options={[
        {
          value: isPool ? PoolsActivityTabType.MY : VaultsActivityTabType.MY,
          label: <Trans>Your Activity</Trans>,
          content: (
            <div
              ref={myScrollRootRef}
              className={getListWrapperClassName(
                loadingMy || itemsMy.length > 0,
              )}
            >
              <ActivityPanelList
                layout={layout}
                type={type}
                mode={ModeType.MY}
                items={itemsMy}
                loading={loadingMy}
                scrollRootRef={myScrollRootRef}
                actionFilter={myActionFilter}
                onActionFilterChange={onMyActionFilterChange}
                showActionFilter={layout !== 'card'}
                pagination={myPagination}
              />
            </div>
          ),
        },
        ...(showPendingTab
          ? [
              {
                value: isPool
                  ? PoolsActivityTabType.PENDING
                  : VaultsActivityTabType.PENDING,
                label: (
                  <span className="flex items-center gap-1.5">
                    <Trans>Your Pending</Trans>
                    {hasPendingOrders ? (
                      <span className="relative inline-flex">
                        <span className="bg-bg-4 font-plex min-w-5 rounded-sm p-0.5 align-middle">
                          {thoFormat(pendingOrdersQuery.data?.length ?? 0)}
                        </span>
                      </span>
                    ) : null}
                  </span>
                ),
                content: (
                  <div
                    className={getListWrapperClassName(
                      pendingOrdersQuery.isLoading || hasPendingOrders,
                    )}
                  >
                    <PendingOrdersList
                      ordersQuery={pendingOrdersQuery}
                      layout={layout}
                      actionFilter={pendingActionFilter}
                      onActionFilterChange={onPendingActionFilterChange}
                    />
                  </div>
                ),
              },
            ]
          : []),
        {
          value: isPool
            ? PoolsActivityTabType.POOL
            : VaultsActivityTabType.VAULT,
          label: isPool ? (
            <Trans>Pool Activity</Trans>
          ) : (
            <Trans>Vault Activity</Trans>
          ),
          content: (
            <div
              ref={allScrollRootRef}
              className={getListWrapperClassName(
                loadingAll || itemsAll.length > 0,
              )}
            >
              <ActivityPanelList
                layout={layout}
                type={type}
                mode={ModeType.ALL}
                items={itemsAll}
                loading={loadingAll}
                scrollRootRef={allScrollRootRef}
                actionFilter={allActionFilter}
                onActionFilterChange={onAllActionFilterChange}
                showActionFilter={layout !== 'card'}
                pagination={allPagination}
              />
            </div>
          ),
        },
      ]}
    />
  );
});

const useActivityPanelTabState = (type: ActivityTabType) => {
  const [poolTabValue, setPoolTabValue] = useState<PoolsActivityTabType>(
    PoolsActivityTabType.POOL,
  );
  const [vaultTabValue, setVaultTabValue] = useState<VaultsActivityTabType>(
    VaultsActivityTabType.VAULT,
  );
  const pathname = usePathname();
  const isActive = useMemo(() => {
    const p = pathname ?? '';
    if (type === ActivityTabType.POOL) return /\/pools(\/|$)/.test(p);
    return /\/vaults(\/|$)/.test(p);
  }, [pathname, type]);
  const realValue = useMemo(() => {
    if (type === ActivityTabType.POOL) {
      return poolTabValue;
    }
    return vaultTabValue;
  }, [type, poolTabValue, vaultTabValue]);
  const realSetValue = useMemo(() => {
    if (type === ActivityTabType.POOL) {
      return setPoolTabValue;
    }
    return setVaultTabValue;
  }, [type]);
  const isPool = type === ActivityTabType.POOL;
  const isVault = type === ActivityTabType.VAULT;
  const isMyTab = isPool
    ? realValue === PoolsActivityTabType.MY
    : realValue === VaultsActivityTabType.MY;
  const isPendingTab = isPool
    ? realValue === PoolsActivityTabType.PENDING
    : realValue === VaultsActivityTabType.PENDING;

  return {
    realValue,
    realSetValue,
    isActive,
    isPool,
    isVault,
    isMyTab,
    isPendingTab,
  };
};

export default function ActivityPanel({
  type,
  marketAddress,
  disableMaxHeight = false,
  fitContentHeight = false,
  layout = 'table',
  disableAnimation = false,
  className,
  disableMobileCard = false,
}: ActivityPanelProps) {
  const isHydrated = useHydrated();
  const {
    realValue,
    realSetValue,
    isActive,
    isPool,
    isVault,
    isMyTab,
    isPendingTab,
  } = useActivityPanelTabState(type);
  const address = useCurrentAccountAddress();
  const hasAddress = !!address;
  const connectionStatus = useConnectionStatus();
  const [myActionFilter, setMyActionFilter] = useState<ActionFilter>(
    ActionFilter.ALL,
  );
  const [allActionFilter, setAllActionFilter] = useState<ActionFilter>(
    ActionFilter.ALL,
  );
  const [pendingActionFilter, setPendingActionFilter] = useState<ActionFilter>(
    ActionFilter.ALL,
  );
  const poolMyEnabled = isActive && isPool && isMyTab && hasAddress;
  const poolAllEnabled = isActive && isPool && !isMyTab && !isPendingTab;
  const vaultMyEnabled = isActive && isVault && isMyTab && hasAddress;
  const vaultAllEnabled = isActive && isVault && !isMyTab && !isPendingTab;
  const pendingOrdersQuery = usePendingLiquidityOrders({
    type,
    marketAddress,
    enabled: SHOW_LP_PENDING_ORDERS && isActive,
  });
  const hasPendingOrders =
    SHOW_LP_PENDING_ORDERS && Boolean(pendingOrdersQuery.data?.length);
  const defaultTabValue = isPool
    ? PoolsActivityTabType.MY
    : VaultsActivityTabType.MY;

  useEffect(() => {
    if (isPendingTab && !hasPendingOrders) {
      realSetValue(
        defaultTabValue as PoolsActivityTabType & VaultsActivityTabType,
      );
    }
  }, [defaultTabValue, hasPendingOrders, isPendingTab, realSetValue]);

  const displayedTabValue =
    isPendingTab && !hasPendingOrders ? defaultTabValue : realValue;

  const poolHistoryMyQuery = usePoolHistoryData({
    marketAddress,
    limit: ACTIVITY_PAGE_SIZE,
    walletAddress: hasAddress ? address : undefined,
    action: getHistoryAction(myActionFilter),
    enabled: poolMyEnabled,
    refetchInterval: false,
  });
  const poolHistoryAllQuery = usePoolHistoryData({
    marketAddress,
    limit: ACTIVITY_PAGE_SIZE,
    walletAddress: undefined,
    action: getHistoryAction(allActionFilter),
    enabled: poolAllEnabled,
    refetchInterval: false,
  });
  const vaultHistoryMyQuery = useVaultHistory({
    marketAddress,
    limit: ACTIVITY_PAGE_SIZE,
    walletAddress: hasAddress ? address : undefined,
    action: getHistoryAction(myActionFilter),
    enabled: vaultMyEnabled,
    refetchInterval: false,
  });
  const vaultHistoryAllQuery = useVaultHistory({
    marketAddress,
    limit: ACTIVITY_PAGE_SIZE,
    walletAddress: undefined,
    action: getHistoryAction(allActionFilter),
    enabled: vaultAllEnabled,
    refetchInterval: false,
  });
  const {
    data: poolMyData,
    isLoading: poolMyIsLoading,
    hasNextPage: poolMyHasNextPage,
    isFetchingNextPage: poolMyIsFetchingNextPage,
    fetchNextPage: poolMyFetchNextPage,
    refetch: poolMyRefetch,
  } = poolHistoryMyQuery;
  const {
    data: poolAllData,
    isLoading: poolAllIsLoading,
    hasNextPage: poolAllHasNextPage,
    isFetchingNextPage: poolAllIsFetchingNextPage,
    fetchNextPage: poolAllFetchNextPage,
    refetch: poolAllRefetch,
  } = poolHistoryAllQuery;
  const {
    data: vaultMyData,
    isLoading: vaultMyIsLoading,
    hasNextPage: vaultMyHasNextPage,
    isFetchingNextPage: vaultMyIsFetchingNextPage,
    fetchNextPage: vaultMyFetchNextPage,
    refetch: vaultMyRefetch,
  } = vaultHistoryMyQuery;
  const {
    data: vaultAllData,
    isLoading: vaultAllIsLoading,
    hasNextPage: vaultAllHasNextPage,
    isFetchingNextPage: vaultAllIsFetchingNextPage,
    fetchNextPage: vaultAllFetchNextPage,
    refetch: vaultAllRefetch,
  } = vaultHistoryAllQuery;

  const poolItemsMy = useMemo(
    () => (hasAddress ? filterHistoryItems(poolMyData?.pages, true) : []),
    [hasAddress, poolMyData?.pages],
  );
  const poolItemsAll = useMemo(
    () => filterHistoryItems(poolAllData?.pages, false),
    [poolAllData?.pages],
  );
  const vaultItemsMy = useMemo(
    () => (hasAddress ? filterHistoryItems(vaultMyData?.pages, true) : []),
    [hasAddress, vaultMyData?.pages],
  );
  const vaultItemsAll = useMemo(
    () => filterHistoryItems(vaultAllData?.pages, true),
    [vaultAllData?.pages],
  );
  const poolMyHasData = !!poolMyData?.pages;
  const poolAllHasData = !!poolAllData?.pages;
  const vaultMyHasData = !!vaultMyData?.pages;
  const vaultAllHasData = !!vaultAllData?.pages;
  const itemsMy = isPool ? poolItemsMy : vaultItemsMy;
  const itemsAll = isPool ? poolItemsAll : vaultItemsAll;

  const isWalletPending =
    isMyTab && !hasAddress && connectionStatus === 'unknown';
  const isInitialLoadingMy = isWalletPending
    ? true
    : isPool
      ? poolMyEnabled && !poolMyHasData && poolMyIsLoading
      : vaultMyEnabled && !vaultMyHasData && vaultMyIsLoading;
  const isInitialLoadingAll = isPool
    ? poolAllEnabled && !poolAllHasData && poolAllIsLoading
    : vaultAllEnabled && !vaultAllHasData && vaultAllIsLoading;
  const isCardLayout = layout === 'card';
  const burstRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const clearBurstRefreshTimer = useCallback(() => {
    if (burstRefreshTimerRef.current) {
      clearInterval(burstRefreshTimerRef.current);
      burstRefreshTimerRef.current = null;
    }
  }, []);

  const refreshBothTabsHistory = useCallback(() => {
    if (!isActive) return;
    if (isPool) {
      void poolAllRefetch();
      if (hasAddress) {
        void poolMyRefetch();
      }
      return;
    }

    void vaultAllRefetch();
    if (hasAddress) {
      void vaultMyRefetch();
    }
  }, [
    hasAddress,
    isActive,
    isPool,
    poolAllRefetch,
    poolMyRefetch,
    vaultAllRefetch,
    vaultMyRefetch,
  ]);
  const refreshBothTabsHistoryRef = useRef(refreshBothTabsHistory);
  useEffect(() => {
    refreshBothTabsHistoryRef.current = refreshBothTabsHistory;
  }, [refreshBothTabsHistory]);
  const refreshBothTabsHistoryEvent = useCallback(() => {
    refreshBothTabsHistoryRef.current();
  }, []);

  useEffect(() => {
    const onHistoryRefresh = (event: Event) => {
      const customEvent =
        event as CustomEvent<LiquidityHistoryRefreshEventDetail>;
      const detail = customEvent.detail;
      if (!detail) return;
      if (detail.activityType !== type) return;
      if (detail.marketAddress.toLowerCase() !== marketAddress.toLowerCase()) {
        return;
      }

      refreshBothTabsHistoryEvent();
      clearBurstRefreshTimer();

      let refreshCount = 0;
      burstRefreshTimerRef.current = setInterval(() => {
        refreshCount += 1;
        refreshBothTabsHistoryEvent();
        if (refreshCount >= POST_TRADE_REFRESH_REPEAT_COUNT) {
          clearBurstRefreshTimer();
        }
      }, POST_TRADE_REFRESH_INTERVAL_MS);
    };

    window.addEventListener(LIQUIDITY_HISTORY_REFRESH_EVENT, onHistoryRefresh);
    return () => {
      window.removeEventListener(
        LIQUIDITY_HISTORY_REFRESH_EVENT,
        onHistoryRefresh,
      );
      clearBurstRefreshTimer();
    };
  }, [
    clearBurstRefreshTimer,
    marketAddress,
    refreshBothTabsHistoryEvent,
    type,
  ]);

  const baseCardClassName = [
    fitContentHeight
      ? 'min-h-0 flex flex-col overflow-hidden p-3'
      : 'h-full min-h-0 flex flex-col overflow-hidden p-3',
    disableMaxHeight ? '' : 'max-h-108',
  ]
    .filter(Boolean)
    .join(' ');
  const containerClassName = [
    baseCardClassName,
    className,
    disableMobileCard ? 'max-md:contents' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const contentWrapClassName = isCardLayout
    ? 'min-h-0 flex-1 flex flex-col relative z-0'
    : 'min-h-0 flex-1 flex flex-col overflow-hidden relative z-0';
  const handleTabValueChange = useCallback(
    (value: string) => {
      realSetValue(value as PoolsActivityTabType & VaultsActivityTabType);
    },
    [realSetValue],
  );
  const myPagination = useMemo<ActivityPagination>(
    () =>
      isPool
        ? {
            hasNextPage: poolMyHasNextPage,
            isFetchingNextPage: poolMyIsFetchingNextPage,
            fetchNextPage: poolMyFetchNextPage,
          }
        : {
            hasNextPage: vaultMyHasNextPage,
            isFetchingNextPage: vaultMyIsFetchingNextPage,
            fetchNextPage: vaultMyFetchNextPage,
          },
    [
      isPool,
      poolMyFetchNextPage,
      poolMyHasNextPage,
      poolMyIsFetchingNextPage,
      vaultMyFetchNextPage,
      vaultMyHasNextPage,
      vaultMyIsFetchingNextPage,
    ],
  );
  const allPagination = useMemo<ActivityPagination>(
    () =>
      isPool
        ? {
            hasNextPage: poolAllHasNextPage,
            isFetchingNextPage: poolAllIsFetchingNextPage,
            fetchNextPage: poolAllFetchNextPage,
          }
        : {
            hasNextPage: vaultAllHasNextPage,
            isFetchingNextPage: vaultAllIsFetchingNextPage,
            fetchNextPage: vaultAllFetchNextPage,
          },
    [
      isPool,
      poolAllFetchNextPage,
      poolAllHasNextPage,
      poolAllIsFetchingNextPage,
      vaultAllFetchNextPage,
      vaultAllHasNextPage,
      vaultAllIsFetchingNextPage,
    ],
  );

  if (!isHydrated) {
    return (
      <ActivityPanelSkeleton
        type={type}
        disableMaxHeight={disableMaxHeight}
        fitContentHeight={fitContentHeight}
        layout={layout}
        className={className}
        disableMobileCard={disableMobileCard}
      />
    );
  }

  return (
    <ModuleCard className={containerClassName}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ActivityPanelTabs
          type={type}
          value={displayedTabValue}
          onValueChange={handleTabValueChange}
          disableAnimation={disableAnimation}
          contentWrapClassName={contentWrapClassName}
          layout={layout}
          itemsMy={itemsMy}
          itemsAll={itemsAll}
          loadingMy={isInitialLoadingMy}
          loadingAll={isInitialLoadingAll}
          myPagination={myPagination}
          allPagination={allPagination}
          myActionFilter={myActionFilter}
          pendingActionFilter={pendingActionFilter}
          allActionFilter={allActionFilter}
          onMyActionFilterChange={setMyActionFilter}
          onPendingActionFilterChange={setPendingActionFilter}
          onAllActionFilterChange={setAllActionFilter}
          pendingOrdersQuery={pendingOrdersQuery}
        />
      </div>
    </ModuleCard>
  );
}
