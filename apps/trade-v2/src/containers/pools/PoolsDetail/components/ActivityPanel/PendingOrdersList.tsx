'use client';

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from 'react';
import { formatAmount, USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import {
  convertToTokenAmount,
  convertToUsd,
} from '@hertzflow/sdk-v2/utils/tokens';
import { Trans, useLingui } from '@lingui/react/macro';
import { ColumnDef } from '@tanstack/react-table';
import { getAddress, type Address } from 'viem';
import { CoinIcon } from '@repo/common/components';
import { unitFormat } from '@repo/lib/format';
import { useQuery, useQueryClient } from '@repo/lib/queryClient';
import {
  Button,
  CheckIcon,
  ChevronDownIcon,
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  LoaderCircleIcon,
  SkeletonLayout,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  XLgIcon,
} from '@repo/ui';
import {
  ConnectBtn,
  HZLP_TOKEN_DECIMALS,
  useCurrentAccountAddress,
  useCustomSignAndExecuteTransaction,
  useHzSdk,
  useInstStore,
} from '@/common';
import { DYNAMIC_DATA_CACHE_TIME } from '@/common/constants/timeConstants';
import { usePriceStore } from '@/common/stores/priceStore';
import Table from '@/components/Table';
import { SHOW_LP_PENDING_ORDERS } from '@/constants/common';
import { convertBigintToHumanReadable } from '@/lib/shared/utils';
import { useHzvValueByVault } from '@/queries/bsc/vaults';
import { LiqTradeType } from '@/stores/pools/trade';
import { useHlvListQuery } from '@/stores/synthetics/marketTokens/queries/useHzvMarketsQuery';
import { useMarketAndHlvTokensData } from '@/stores/synthetics/marketTokens/selectors';
import type { TokensViewData } from '@/stores/synthetics/marketTokens/types';
import { ActivityEmptyIcon } from './ActivityList';
import { ActionFilter, ActivityTabType, getActionFilterOptions } from './types';
import type { LiquidityOrder, LiquidityOrderScope } from '@hertzflow/sdk-v2';

const PENDING_SKELETON_COUNT = 5;
const MIN_PENDING_ORDER_AGE_MS = 30_000;

const isOldEnoughToDisplay = (order: LiquidityOrder) =>
  Date.now() - Number(order.numbers.updatedAtTime) * 1_000 >
  MIN_PENDING_ORDER_AGE_MS;

const removeOrdersFromCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  chainId: number,
  account: string,
  orders: LiquidityOrder[],
) => {
  const orderKeysByScope = new Map<LiquidityOrderScope, Set<string>>();
  for (const order of orders) {
    const orderKeys = orderKeysByScope.get(order.scope) ?? new Set<string>();
    orderKeys.add(order.key);
    orderKeysByScope.set(order.scope, orderKeys);
  }

  for (const [scope, orderKeys] of orderKeysByScope) {
    queryClient.setQueriesData<LiquidityOrder[]>(
      {
        queryKey: ['liquidity-orders', chainId, account, scope],
      },
      (cachedOrders) =>
        cachedOrders?.filter((order) => !orderKeys.has(order.key)),
    );
  }
};

export const liquidityOrdersQueryKey = (
  chainId: number | undefined,
  account: string,
  scope: LiquidityOrderScope,
  marketAddress?: string,
) => ['liquidity-orders', chainId, account, scope, marketAddress] as const;

export function usePendingLiquidityOrders({
  type,
  marketAddress,
  enabled,
}: {
  type: ActivityTabType;
  marketAddress?: string;
  enabled: boolean;
}) {
  const hzSdk = useHzSdk();
  const address = useCurrentAccountAddress();
  const scope: LiquidityOrderScope =
    type === ActivityTabType.POOL ? 'market' : 'hlv';

  return useQuery({
    queryKey: liquidityOrdersQueryKey(
      hzSdk?.chainId,
      address,
      scope,
      marketAddress,
    ),
    enabled:
      SHOW_LP_PENDING_ORDERS && enabled && Boolean(hzSdk && address),
    queryFn: async () => {
      if (!hzSdk || !address) return [];
      const orders = await hzSdk.liquidity.getOrders({
        account: address,
        marketAddress: marketAddress
          ? (marketAddress as `0x${string}`)
          : undefined,
        scope,
      });
      return orders.filter(isOldEnoughToDisplay);
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

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

function PendingActionHeader({
  actionFilter,
  onActionFilterChange,
}: {
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`hover:bg-bg-3 flex items-center gap-1 rounded-lg px-3 py-1 text-left text-xs ${
            actionFilter === ActionFilter.ALL ? '' : 'text-t-1100'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <Trans>Action</Trans>
          <ChevronDownIcon size={14} className="shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="bg-bg-3 w-max min-w-[120px]"
      >
        {getActionFilterOptions(false).map((filter) => (
          <DropdownMenuItem
            key={filter}
            className={`mb-1 flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-left text-xs outline-none last:mb-0 ${
              actionFilter === filter
                ? 'bg-bg-4 text-t-1100'
                : 'text-t-1100 hover:bg-bg-4'
            }`}
            onSelect={() => onActionFilterChange(filter)}
          >
            <span className="whitespace-nowrap">
              {ACTION_FILTER_LABEL[filter]}
            </span>
            <span className="flex size-4 items-center justify-center">
              {actionFilter === filter ? <CheckIcon size={16} /> : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const getOrderAction = (order: LiquidityOrder) =>
  order.kind === 'deposit' ? LiqTradeType.Deposit : LiqTradeType.Withdraw;

const getByAddress = <T,>(
  items: Record<string, T> | undefined,
  address: string,
) => {
  if (!items) return undefined;
  const checksumAddress = getAddress(address);
  return items[checksumAddress] ?? items[checksumAddress.toLowerCase()];
};

type OrderValueContext = {
  insts: Record<
    string,
    { longTokenAddress: string; shortTokenAddress: string }
  >;
  coins: Record<string, { decimals: number }>;
  prices: Record<string, { minPrice: bigint; maxPrice: bigint }>;
  tokens: TokensViewData | undefined;
  hlvPrice?: {
    address: string;
    minPrice: bigint;
    maxPrice: bigint;
  };
};

const getOrderLpToken = (
  order: LiquidityOrder,
  tokens: TokensViewData | undefined,
) => {
  const lpAddress =
    order.scope === 'hlv' ? order.addresses.hlv : order.addresses.market;
  return lpAddress ? getByAddress(tokens, lpAddress) : undefined;
};

const getOrderLpPrice = (
  order: LiquidityOrder,
  token: ReturnType<typeof getOrderLpToken>,
  hlvPrice: OrderValueContext['hlvPrice'],
) => {
  const prices =
    order.scope === 'hlv' &&
    order.addresses.hlv?.toLowerCase() === hlvPrice?.address.toLowerCase()
      ? hlvPrice
      : token?.prices;
  if (!prices) return undefined;

  const preferredPrice =
    order.kind === 'deposit' ? prices.maxPrice : prices.minPrice;
  if (preferredPrice > 0n) return preferredPrice;

  const fallbackPrice =
    order.kind === 'deposit' ? prices.minPrice : prices.maxPrice;
  return fallbackPrice > 0n ? fallbackPrice : undefined;
};

const getDepositValueUsd = (
  order: LiquidityOrder,
  { insts, coins, prices }: OrderValueContext,
) => {
  const market = getByAddress(insts, order.addresses.market);
  if (!market) return undefined;

  const longAmount = order.numbers.initialLongTokenAmount;
  const shortAmount = order.numbers.initialShortTokenAmount;
  const getTokenValueUsd = (amount: bigint | undefined, address: string) => {
    if (!amount) return 0n;
    const token = getByAddress(coins, address);
    const tokenPrices = getByAddress(prices, address);
    if (!token || !tokenPrices) return undefined;
    return convertToUsd(amount, token.decimals, tokenPrices.maxPrice);
  };
  const longValueUsd = getTokenValueUsd(longAmount, market.longTokenAddress);
  const shortValueUsd = getTokenValueUsd(shortAmount, market.shortTokenAddress);
  if (longValueUsd === undefined || shortValueUsd === undefined) {
    return undefined;
  }
  return longValueUsd + shortValueUsd;
};

const getOrderShares = (order: LiquidityOrder, context: OrderValueContext) => {
  const lpToken = getOrderLpToken(order, context.tokens);
  if (order.kind === 'deposit') {
    return convertToTokenAmount(
      getDepositValueUsd(order, context),
      lpToken?.decimals ?? HZLP_TOKEN_DECIMALS,
      getOrderLpPrice(order, lpToken, context.hlvPrice),
    );
  }

  return order.scope === 'hlv'
    ? order.numbers.hlvTokenAmount
    : order.numbers.marketTokenAmount;
};

const getOrderValueUsd = (
  order: LiquidityOrder,
  context: OrderValueContext,
) => {
  if (order.kind === 'deposit') {
    return getDepositValueUsd(order, context);
  }

  const lpToken = getOrderLpToken(order, context.tokens);
  const lpAmount =
    order.scope === 'hlv'
      ? order.numbers.hlvTokenAmount
      : order.numbers.marketTokenAmount;
  return convertToUsd(
    lpAmount,
    lpToken?.decimals ?? HZLP_TOKEN_DECIMALS,
    getOrderLpPrice(order, lpToken, context.hlvPrice),
  );
};

const formatOrderShares = (
  order: LiquidityOrder,
  context: OrderValueContext,
) => {
  const shares = getOrderShares(order, context);
  return shares === undefined
    ? '--'
    : formatAmount(shares, HZLP_TOKEN_DECIMALS, 4, true);
};

const formatOrderValue = (
  order: LiquidityOrder,
  context: OrderValueContext,
) => {
  const valueUsd = getOrderValueUsd(order, context);
  if (valueUsd === undefined) return '--';
  return unitFormat(convertBigintToHumanReadable(valueUsd, USD_DECIMALS), 2, {
    style: 'currency',
    currency: 'USD',
    showMinDecimalValue: true,
    stripTrailingZeros: true,
  });
};

type PendingCancelProps = {
  order: LiquidityOrder;
  onCancel: (order: LiquidityOrder) => Promise<void>;
  iconOnly?: boolean;
};

type PendingCancellationContextValue = {
  cancellingKey?: string;
  cancellingKeyRef: RefObject<string | undefined>;
  isCancellingAll: boolean;
  isCancellingAllRef: RefObject<boolean>;
};

const PendingCancellationContext =
  createContext<PendingCancellationContextValue | null>(null);

const usePendingCancellation = () => {
  const context = useContext(PendingCancellationContext);
  if (!context) {
    throw new Error(
      'Pending cancellation components must be rendered inside PendingCancellationContext',
    );
  }
  return context;
};

const PendingCancel = memo(function PendingCancel({
  order,
  onCancel,
  iconOnly = false,
}: PendingCancelProps) {
  const { t } = useLingui();
  const {
    cancellingKey,
    cancellingKeyRef,
    isCancellingAll,
    isCancellingAllRef,
  } = usePendingCancellation();
  const orderRef = useRef(order);
  const onCancelRef = useRef(onCancel);
  const isProcessingRef = useRef(false);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  orderRef.current = order;
  onCancelRef.current = onCancel;

  const isCancellingAllActive = isCancellingAll || isCancellingAllRef.current;
  const isThisItemProcessing =
    !isCancellingAllActive &&
    (cancellingKey === order.key ||
      cancellingKeyRef.current === order.key ||
      isLocalProcessing);
  const isDisabled =
    Boolean(cancellingKey) ||
    Boolean(cancellingKeyRef.current) ||
    isThisItemProcessing ||
    isCancellingAllActive;
  const handleCancel = useCallback(async () => {
    if (
      isProcessingRef.current ||
      cancellingKey ||
      cancellingKeyRef.current ||
      isCancellingAll ||
      isCancellingAllRef.current
    ) {
      return;
    }
    isProcessingRef.current = true;
    setIsLocalProcessing(true);
    try {
      await onCancelRef.current(orderRef.current);
    } finally {
      isProcessingRef.current = false;
      setIsLocalProcessing(false);
    }
  }, [cancellingKey, cancellingKeyRef, isCancellingAll, isCancellingAllRef]);

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <button
              type="button"
              aria-label={t`Cancel`}
              className="text-t-430 hover:text-t-1100 inline-flex size-6 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDisabled}
              onClick={(event) => {
                event.stopPropagation();
                void handleCancel();
              }}
            >
              {isThisItemProcessing ? (
                <LoaderCircleIcon size={16} className="animate-spin" />
              ) : (
                <XLgIcon size={16} />
              )}
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{t`Cancel`}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      size="sm"
      variant="accent"
      className="h-6"
      disabled={isDisabled}
      onClick={(event) => {
        event.stopPropagation();
        void handleCancel();
      }}
    >
      {isThisItemProcessing ? (
        <>
          <LoaderCircleIcon size={16} className="animate-spin" />
          {t`Cancelling`}
        </>
      ) : (
        t`Cancel`
      )}
    </Button>
  );
});

const PendingCancelAll = memo(function PendingCancelAll({
  orders,
  onCancelAll,
}: {
  orders: LiquidityOrder[];
  onCancelAll: (orders: LiquidityOrder[]) => Promise<void>;
}) {
  const { t } = useLingui();
  const {
    cancellingKey,
    cancellingKeyRef,
    isCancellingAll,
    isCancellingAllRef,
  } = usePendingCancellation();
  const onCancelAllRef = useRef(onCancelAll);
  const ordersRef = useRef(orders);
  onCancelAllRef.current = onCancelAll;
  ordersRef.current = orders;
  const orderCount = orders.length;
  const isDisabled =
    !orderCount ||
    isCancellingAll ||
    isCancellingAllRef.current ||
    Boolean(cancellingKey) ||
    Boolean(cancellingKeyRef.current);

  const handleCancelAll = useCallback(async () => {
    if (isDisabled || isCancellingAllRef.current || cancellingKeyRef.current) {
      return;
    }
    await onCancelAllRef.current(ordersRef.current);
  }, [cancellingKeyRef, isCancellingAllRef, isDisabled]);

  return (
    <Button
      size="xs"
      variant="accentLight"
      disabled={isDisabled}
      onClick={(event) => {
        event.stopPropagation();
        void handleCancelAll();
      }}
    >
      {isCancellingAll ? (
        <>
          <LoaderCircleIcon size={14} className="animate-spin" />
          {t`Cancelling`}
        </>
      ) : orderCount ? (
        t`Cancel all (${orderCount})`
      ) : (
        t`Cancel all`
      )}
    </Button>
  );
});

type PendingRow = {
  __rowId: string;
  order?: LiquidityOrder;
  __isSkeleton?: boolean;
};

const pendingSkeletonRows: PendingRow[] = Array.from(
  { length: PENDING_SKELETON_COUNT },
  (_, index) => ({
    __rowId: `pending-order-skeleton-${index}`,
    __isSkeleton: true,
  }),
);

const createPendingColumns = ({
  actionFilter,
  onActionFilterChange,
  orders,
  orderShares,
  orderValues,
  onCancel,
  onCancelAll,
}: {
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
  orders: LiquidityOrder[];
  orderShares: Record<string, string>;
  orderValues: Record<string, string>;
  onCancel: (order: LiquidityOrder) => Promise<void>;
  onCancelAll: (orders: LiquidityOrder[]) => Promise<void>;
}): ColumnDef<PendingRow>[] => [
  {
    id: 'action',
    header: () => (
      <PendingActionHeader
        actionFilter={actionFilter}
        onActionFilterChange={onActionFilterChange}
      />
    ),
    meta: {
      headerClassName: 'min-w-[140px]',
      bodyClassName: 'min-w-[140px]',
    },
    cell: ({ row }) => {
      if (row.original.__isSkeleton || !row.original.order) {
        return <SkeletonLayout isLoading className="h-4 w-20" />;
      }
      const action = getOrderAction(row.original.order);
      return (
        <div className="flex items-center gap-2 font-medium">
          {action === LiqTradeType.Deposit ? (
            <CircleArrowDownIcon size={24} />
          ) : (
            <CircleArrowUpIcon size={24} />
          )}
          {action === LiqTradeType.Deposit ? (
            <Trans>Deposit</Trans>
          ) : (
            <Trans>Withdraw</Trans>
          )}
        </div>
      );
    },
  },
  {
    id: 'shares',
    header: () => <Trans>Shares</Trans>,
    meta: {
      headerClassName: 'min-w-[120px]',
      bodyClassName: 'min-w-[120px]',
    },
    cell: ({ row }) =>
      row.original.__isSkeleton || !row.original.order ? (
        <SkeletonLayout isLoading className="h-4 w-16" />
      ) : (
        <div className="font-medium">
          {orderShares[row.original.order.key] ?? '--'}
        </div>
      ),
  },
  {
    id: 'value',
    header: () => <Trans>Value</Trans>,
    meta: {
      headerClassName: 'min-w-[160px]',
      bodyClassName: 'min-w-[160px]',
    },
    cell: ({ row }) =>
      row.original.__isSkeleton || !row.original.order ? (
        <SkeletonLayout isLoading className="h-4 w-24" />
      ) : (
        <div className="font-medium">
          {orderValues[row.original.order.key] ?? '--'}
        </div>
      ),
  },
  {
    id: 'cancel',
    header: () => (
      <PendingCancelAll orders={orders} onCancelAll={onCancelAll} />
    ),
    meta: {
      headerClassName: 'min-w-[100px]',
      bodyClassName: 'min-w-[100px]',
    },
    cell: ({ row }) =>
      row.original.__isSkeleton || !row.original.order ? (
        <SkeletonLayout isLoading className="h-6 w-16 rounded-lg" />
      ) : (
        <PendingCancel order={row.original.order} onCancel={onCancel} />
      ),
  },
];

const PendingMobileCard = memo(function PendingMobileCard({
  order,
  shares,
  value,
  onCancel,
  portfolioStyle,
  market,
}: {
  order: LiquidityOrder;
  shares: string;
  value: string;
  onCancel: (order: LiquidityOrder) => Promise<void>;
  portfolioStyle: boolean;
  market?: { icon?: string; name?: string };
}) {
  const action = getOrderAction(order);
  if (portfolioStyle) {
    return (
      <div className="group/self relative border-t py-3 text-xs">
        <div className="group-hover/self:bg-bg-4 absolute inset-1 -right-2 -left-2 -z-1 rounded-lg transition-[background] duration-400" />
        <div className="flex min-w-0 items-center gap-2">
          <CoinIcon size={24} src={market?.icon} alt={market?.name ?? ''} />
          <span className="min-w-0 truncate font-medium">
            {market?.name ?? '--'}
          </span>
          <span className="bg-accent/10 text-accent ml-1 shrink-0 rounded-sm px-2 py-0.5">
            {action === LiqTradeType.Deposit ? (
              <Trans>Deposit</Trans>
            ) : (
              <Trans>Withdraw</Trans>
            )}
          </span>
          <span className="ml-auto shrink-0">
            <PendingCancel order={order} onCancel={onCancel} iconOnly />
          </span>
        </div>
        <div className="mt-3 grid w-full grid-cols-[4fr_3fr]">
          <div className="flex flex-col gap-1">
            <span className="text-secondary-foreground text-xs">
              <Trans>Shares</Trans>
            </span>
            <span className="font-plex text-sm">{shares}</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-secondary-foreground text-xs">
              <Trans>Value</Trans>
            </span>
            <span className="font-plex text-sm">{value}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white/3 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          {action === LiqTradeType.Deposit ? (
            <CircleArrowDownIcon size={24} />
          ) : (
            <CircleArrowUpIcon size={24} />
          )}
          {action === LiqTradeType.Deposit ? (
            <Trans>Deposit</Trans>
          ) : (
            <Trans>Withdraw</Trans>
          )}
        </div>
        <PendingCancel order={order} onCancel={onCancel} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-t-270 text-xs">
            <Trans>Shares</Trans>
          </div>
          <div className="mt-1 font-medium">{shares}</div>
        </div>
        <div className="text-right">
          <div className="text-t-270 text-xs">
            <Trans>Value</Trans>
          </div>
          <div className="mt-1 font-medium">{value}</div>
        </div>
      </div>
    </div>
  );
});

type PendingOrdersListProps = {
  ordersQuery: ReturnType<typeof usePendingLiquidityOrders>;
  layout: 'card' | 'table';
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
  portfolioStyle?: boolean;
};

export default function PendingOrdersList({
  ordersQuery,
  layout,
  actionFilter,
  onActionFilterChange,
  portfolioStyle = false,
}: PendingOrdersListProps) {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const address = useCurrentAccountAddress();
  const queryClient = useQueryClient();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const prices = usePriceStore((state) => state.pricesMap);
  const [cancellingKey, setCancellingKey] = useState<string>();
  const [isCancellingAll, setIsCancellingAll] = useState(false);
  const cancellingKeyRef = useRef<string | undefined>(undefined);
  const isCancellingAllRef = useRef(false);
  const pendingCancellationContext = useMemo(
    () => ({
      cancellingKey,
      cancellingKeyRef,
      isCancellingAll,
      isCancellingAllRef,
    }),
    [cancellingKey, isCancellingAll],
  );
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const hasHlvOrders = orders.some((order) => order.scope === 'hlv');
  const { data: hlvListResult } = useHlvListQuery({
    enabled: hasHlvOrders,
  });
  const vaultAddresses = useMemo<Address[] | undefined>(() => {
    if (!hasHlvOrders) return undefined;
    return Array.from(
      new Set(
        orders.flatMap((order) =>
          order.addresses.hlv ? [order.addresses.hlv] : [],
        ),
      ),
    ) as Address[];
  }, [hasHlvOrders, orders]);
  const singleVaultAddress =
    vaultAddresses?.length === 1 ? vaultAddresses[0] : undefined;
  const { data: singleVaultValues } = useHzvValueByVault(singleVaultAddress, {
    refetchInterval: DYNAMIC_DATA_CACHE_TIME,
  });
  const marketAddresses = useMemo<Address[]>(() => {
    if (!hasHlvOrders) {
      return Array.from(
        new Set(orders.map((order) => order.addresses.market)),
      ) as Address[];
    }

    const selectedVaults = new Set(
      vaultAddresses?.map((address) => address.toLowerCase()),
    );
    const addresses = new Set<Address>();
    for (const { hlv, markets } of hlvListResult?.hlvList ?? []) {
      if (!selectedVaults.has(hlv.hlvToken.toLowerCase())) continue;
      for (const market of markets) {
        addresses.add(market);
      }
    }
    return Array.from(addresses);
  }, [hasHlvOrders, hlvListResult?.hlvList, orders, vaultAddresses]);
  const tokensView = useMarketAndHlvTokensData({
    withHlv: hasHlvOrders,
    marketAddresses,
    vaultAddresses,
  });
  const orderValueContext = useMemo<OrderValueContext>(
    () => ({
      insts,
      coins,
      prices,
      tokens: tokensView,
      hlvPrice:
        singleVaultAddress && singleVaultValues
          ? {
              address: singleVaultAddress,
              minPrice:
                singleVaultValues.hlvTokenPriceMin ??
                singleVaultValues.hlvTokenPrice,
              maxPrice:
                singleVaultValues.hlvTokenPriceMax ??
                singleVaultValues.hlvTokenPrice,
            }
          : undefined,
    }),
    [
      coins,
      insts,
      prices,
      singleVaultAddress,
      singleVaultValues,
      tokensView,
    ],
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (actionFilter === ActionFilter.DEPOSITS) {
          return order.kind === 'deposit';
        }
        if (actionFilter === ActionFilter.WITHDRAWALS) {
          return order.kind === 'withdrawal';
        }
        return true;
      }),
    [actionFilter, orders],
  );
  const orderValues = useMemo(
    () =>
      Object.fromEntries(
        filteredOrders.map((order) => [
          order.key,
          formatOrderValue(order, orderValueContext),
        ]),
      ),
    [filteredOrders, orderValueContext],
  );
  const orderShares = useMemo(
    () =>
      Object.fromEntries(
        filteredOrders.map((order) => [
          order.key,
          formatOrderShares(order, orderValueContext),
        ]),
      ),
    [filteredOrders, orderValueContext],
  );
  const refetchOrders = ordersQuery.refetch;
  const refreshCancelledOrders = useCallback(
    async (cancelledOrders: LiquidityOrder[]) => {
      const clearCancelledOrders = () => {
        if (!hzSdk || !address) return;
        removeOrdersFromCache(
          queryClient,
          hzSdk.chainId,
          address,
          cancelledOrders,
        );
      };

      clearCancelledOrders();
      try {
        await refetchOrders();
      } catch {
        // Keep the optimistic cache update when the refresh request fails.
      }
      clearCancelledOrders();
    },
    [address, hzSdk, queryClient, refetchOrders],
  );
  const submitCancel = useCallback(
    async (order: LiquidityOrder, refetchAfterSuccess: boolean) => {
      if (!hzSdk) return false;
      const result = await executeTransaction({
        toast: {
          title:
            order.scope === 'hlv'
              ? t`Cancel Vault Order`
              : t`Cancel Pool Order`,
          description: t`Submitting`,
          successDescription: t`Canceled`,
          id: `cancel-liquidity-order-${order.key}`,
        },
        executeTransaction: () => hzSdk.liquidity.cancelOrder(order),
        onSuccess: refetchAfterSuccess
          ? async () => {
              await refreshCancelledOrders([order]);
            }
          : undefined,
      });
      return result.success;
    },
    [executeTransaction, hzSdk, refreshCancelledOrders, t],
  );
  const handleCancel = useCallback(
    async (order: LiquidityOrder) => {
      if (
        !hzSdk ||
        cancellingKey ||
        cancellingKeyRef.current ||
        isCancellingAll ||
        isCancellingAllRef.current
      ) {
        return;
      }
      cancellingKeyRef.current = order.key;
      setCancellingKey(order.key);
      try {
        await submitCancel(order, true);
      } finally {
        cancellingKeyRef.current = undefined;
        setCancellingKey(undefined);
      }
    },
    [
      cancellingKey,
      cancellingKeyRef,
      hzSdk,
      isCancellingAll,
      isCancellingAllRef,
      submitCancel,
    ],
  );
  const handleCancelAll = useCallback(
    async (ordersToCancel: LiquidityOrder[]) => {
      const firstOrder = ordersToCancel[0];
      if (
        !hzSdk ||
        cancellingKey ||
        cancellingKeyRef.current ||
        isCancellingAll ||
        isCancellingAllRef.current ||
        !firstOrder
      ) {
        return;
      }
      isCancellingAllRef.current = true;
      setIsCancellingAll(true);
      try {
        await executeTransaction({
          toast: {
            title: t`Cancel all`,
            description: t`Submitting`,
            successDescription: t`Canceled`,
            id: `cancel-all-liquidity-orders-${firstOrder.scope}`,
          },
          executeTransaction: () =>
            hzSdk.liquidity.cancelOrders(ordersToCancel),
          onSuccess: async () => {
            await refreshCancelledOrders(ordersToCancel);
          },
        });
      } finally {
        isCancellingAllRef.current = false;
        setIsCancellingAll(false);
      }
    },
    [
      cancellingKey,
      cancellingKeyRef,
      executeTransaction,
      hzSdk,
      isCancellingAll,
      isCancellingAllRef,
      refreshCancelledOrders,
      t,
    ],
  );
  const columns = useMemo(
    () =>
      createPendingColumns({
        actionFilter,
        onActionFilterChange,
        orders: filteredOrders,
        orderShares,
        orderValues,
        onCancel: handleCancel,
        onCancelAll: handleCancelAll,
      }),
    [
      actionFilter,
      filteredOrders,
      handleCancel,
      handleCancelAll,
      onActionFilterChange,
      orderShares,
      orderValues,
    ],
  );
  const tableRows = useMemo(
    () =>
      ordersQuery.isLoading
        ? pendingSkeletonRows
        : filteredOrders.map((order) => ({
            __rowId: order.key,
            order,
          })),
    [filteredOrders, ordersQuery.isLoading],
  );
  const emptyMessage = !address ? (
    <div
      className={
        layout === 'card'
          ? 'flex flex-col items-center justify-center gap-3 py-6'
          : 'flex h-full flex-col items-center justify-center gap-3 max-md:mt-6'
      }
    >
      <ActivityEmptyIcon />
      <div className="text-sm font-medium max-md:text-sm">
        <Trans>Please connect your wallet to continue.</Trans>
      </div>
      <ConnectBtn
        className={
          layout === 'card'
            ? 'max-md:!text-accent w-[220px] max-w-[60vw] text-xs underline-offset-2 max-md:size-auto max-md:!bg-transparent max-md:p-0 max-md:text-sm max-md:underline'
            : 'max-md:!text-accent w-[220px] max-w-[50vw] text-xs underline-offset-2 max-md:size-auto max-md:!bg-transparent max-md:p-0 max-md:text-sm max-md:underline'
        }
      />
    </div>
  ) : orders.length > 0 ? (
    <div className="text-t-350 flex h-full items-center justify-center text-sm">
      <Trans>No matching records found.</Trans>
    </div>
  ) : (
    <div className="text-t-350 flex h-full items-center justify-center text-sm">
      <Trans>No pending requests.</Trans>
    </div>
  );

  return (
    <PendingCancellationContext.Provider value={pendingCancellationContext}>
      <div className="flex h-full min-w-0 flex-col">
        {layout === 'table' ? (
          <Table
            columns={columns}
            data={tableRows}
            getRowId={(row) => row.__rowId}
            isLoading={false}
            emptyMessage={emptyMessage}
            noBorder
            outerClassName="min-h-0 flex-1"
            headCellClassName="h-auto pt-0 pb-2 sticky top-0 z-30"
            bodyCellClassName="py-1"
            wrapClassName="h-auto min-h-full overflow-visible pb-0"
            emptyFullHeight
          />
        ) : ordersQuery.isLoading ? (
          <div className="space-y-2">
            {pendingSkeletonRows.map((row) => (
              <SkeletonLayout
                key={row.__rowId}
                isLoading
                className="h-[104px] w-full rounded-xl"
              />
            ))}
          </div>
        ) : filteredOrders.length ? (
          <div className={portfolioStyle ? 'flex flex-col' : 'space-y-2'}>
            {filteredOrders.map((order) => {
              const market = getByAddress(insts, order.addresses.market);
              return (
                <PendingMobileCard
                  key={order.key}
                  order={order}
                  shares={orderShares[order.key] ?? '--'}
                  value={orderValues[order.key] ?? '--'}
                  onCancel={handleCancel}
                  portfolioStyle={portfolioStyle}
                  market={market}
                />
              );
            })}
          </div>
        ) : (
          emptyMessage
        )}
      </div>
    </PendingCancellationContext.Provider>
  );
}
