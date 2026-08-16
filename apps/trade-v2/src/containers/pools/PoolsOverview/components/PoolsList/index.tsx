'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Trans, useLingui } from '@lingui/react/macro';
import { VisibilityState, type PaginationState } from '@tanstack/react-table';
import {
  Input,
  Label,
  Switch,
  Skeleton,
  SearchIcon,
  ChevronDownIcon,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  cn,
} from '@repo/ui';
import {
  TradeTabs,
  HorizontalScrollBox,
  WalletConnectEmptyState,
} from '@/common';
import { usePrivy } from '@/common/chainClient';
import { useCurrentAccountAddress } from '@/common/chainClient/hooks';
import { useHydrated } from '@/common/hooks/useHydrated';
import Table from '@/components/Table';
import { getCategoryLabelMessage } from '@/lib/market/categoryLabels';
import {
  CATEGORY,
  DEFAULT_POOLS_LIST_PAGE_SIZE,
  type PoolsListSortBy,
  type PoolsListSortOrder,
  type fetchPoolsList,
} from '@/services/rest/pools';
import { usePoolFavoritesStore } from '@/stores/pools/favorites';
import { usePoolsListRows } from '@/stores/synthetics/marketsData/selectors';
import type { PoolsListItem } from '@/stores/synthetics/marketTokens/selectors';
import MobilePoolCard from '../MobilePoolCard';
import { FeeApyHeader, createColumns } from './columns';
import {
  DesktopPoolsTableSkeleton,
  MobilePoolsControlsSkeleton,
} from './Skeleton';
import { poolsListSkeletonRows } from './skeletonRows';

const validateSearchInput = (value: string): string => {
  const alphanumeric = value.replace(/[^a-zA-Z0-9]/g, '');
  return alphanumeric.slice(0, 42);
};

const DEFAULT_PAGE_SIZE = DEFAULT_POOLS_LIST_PAGE_SIZE;
const WALLET_EMPTY_LIST_HEIGHT_CLASS = 'h-[440px]';
const POOLS_LIST_SESSION_STORAGE_KEY = 'trade-v2:pools-list-state';
const POOLS_CATEGORY_VALUES = [
  CATEGORY.all,
  CATEGORY.favorites,
  CATEGORY.forex,
  CATEGORY.equities,
  CATEGORY.indices,
  CATEGORY.crypto,
  CATEGORY.commodities,
  CATEGORY.memes,
];
const POOLS_DYNAMIC_CATEGORY_VALUES = [
  CATEGORY.forex,
  CATEGORY.equities,
  CATEGORY.indices,
  CATEGORY.crypto,
  CATEGORY.commodities,
  CATEGORY.memes,
] as const;

type PoolsCategoryOption = {
  value: CATEGORY;
  label: string;
};

type PageNumber = number | 'ellipsis-left' | 'ellipsis-right';
type PoolsListSessionState = {
  category?: CATEGORY;
  inWalletOnly?: boolean;
  sortBy?: PoolsListSortBy;
  sortOrder?: PoolsListSortOrder;
};

const isPoolsCategory = (value: unknown): value is CATEGORY =>
  POOLS_CATEGORY_VALUES.includes(value as CATEGORY);

const isPoolsListSortBy = (value: unknown): value is PoolsListSortBy =>
  value === 'tvl_usd' || value === 'fee_apy';

const isPoolsListSortOrder = (value: unknown): value is PoolsListSortOrder =>
  value === 'asc' || value === 'desc';

const usePoolsCategoryAvailability = (enabled: boolean) => {
  const forex = usePoolsListRows({
    category: CATEGORY.forex,
    page: 1,
    pageSize: 1,
    enabled,
  });
  const equities = usePoolsListRows({
    category: CATEGORY.equities,
    page: 1,
    pageSize: 1,
    enabled,
  });
  const indices = usePoolsListRows({
    category: CATEGORY.indices,
    page: 1,
    pageSize: 1,
    enabled,
  });
  const crypto = usePoolsListRows({
    category: CATEGORY.crypto,
    page: 1,
    pageSize: 1,
    enabled,
  });
  const commodities = usePoolsListRows({
    category: CATEGORY.commodities,
    page: 1,
    pageSize: 1,
    enabled,
  });
  const memes = usePoolsListRows({
    category: CATEGORY.memes,
    page: 1,
    pageSize: 1,
    enabled,
  });

  return useMemo(() => {
    const results = [forex, equities, indices, crypto, commodities, memes];

    if (!enabled || results.some((result) => result.isLoading)) {
      return {
        ready: false,
        categories: new Set<CATEGORY>(),
      };
    }

    const categories = new Set<CATEGORY>();
    results.forEach((result, index) => {
      const category = POOLS_DYNAMIC_CATEGORY_VALUES[index];
      if (result.totalCount > 0 && category) {
        categories.add(category);
      }
    });

    return { ready: true, categories };
  }, [commodities, crypto, equities, enabled, forex, indices, memes]);
};

const readPoolsListSessionState = (): PoolsListSessionState => {
  if (typeof window === 'undefined') return {};

  try {
    const rawValue = window.sessionStorage.getItem(
      POOLS_LIST_SESSION_STORAGE_KEY,
    );
    if (!rawValue) return {};

    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    return {
      category: isPoolsCategory(parsed.category) ? parsed.category : undefined,
      inWalletOnly:
        typeof parsed.inWalletOnly === 'boolean'
          ? parsed.inWalletOnly
          : undefined,
      sortBy: isPoolsListSortBy(parsed.sortBy) ? parsed.sortBy : undefined,
      sortOrder: isPoolsListSortOrder(parsed.sortOrder)
        ? parsed.sortOrder
        : undefined,
    };
  } catch {
    return {};
  }
};

const writePoolsListSessionState = (state: Required<PoolsListSessionState>) => {
  try {
    window.sessionStorage.setItem(
      POOLS_LIST_SESSION_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // ignore unavailable sessionStorage
  }
};

const createPageNumbers = (
  totalPages: number,
  currentPage: number,
): PageNumber[] => {
  const pages: PageNumber[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
    return pages;
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis-right', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      'ellipsis-left',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);
  pages.push(1);
  if (startPage > 2) {
    pages.push('ellipsis-left');
  }
  for (let i = startPage; i <= endPage; i += 1) {
    pages.push(i);
  }
  if (endPage < totalPages - 1) {
    pages.push('ellipsis-right');
  }
  pages.push(totalPages);
  return pages;
};

type PoolsControlsProps = {
  isHydrated: boolean;
  value: CATEGORY;
  options: PoolsCategoryOption[];
  onValueChange: (value: CATEGORY) => void;
  symbolFilterValue: string;
  onSymbolFilterChange: (value: string) => void;
  ready: boolean;
  inWalletOnly: boolean;
  onInWalletOnlyChange: (checked: boolean) => void;
};

const PoolsDesktopControls = memo(function PoolsDesktopControls({
  isHydrated,
  value,
  options,
  onValueChange,
  symbolFilterValue,
  onSymbolFilterChange,
  ready,
  inWalletOnly,
  onInWalletOnlyChange,
}: PoolsControlsProps) {
  const { t } = useLingui();

  if (!isHydrated) {
    return (
      <div className="flex shrink-0 items-center gap-6">
        <div className="bg-bg-3 h-8 flex-1 rounded-xl" />
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="bg-bg-3 h-8 w-1/2 rounded-xl" />
          <div className="bg-bg-3 h-4 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-6">
      <HorizontalScrollBox shadowOpacity={0.4} className="w-0.55">
        <TradeTabs
          value={value}
          onValueChange={(value) => {
            onValueChange(value as CATEGORY);
          }}
          options={options}
          className="gap-0"
          listClassName="z-2 flex gap-1 font-medium justify-start"
          labelClassName="rounded-xl px-4 py-[9px] data-[state=active]:text-t-1100 grow-0 text-xs"
          activeBarClassName="z-1 bg-bg-3 rounded-xl px-4 py-2"
        />
      </HorizontalScrollBox>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <Input
          prefix={<SearchIcon className="max-h-4 max-w-4" />}
          className="md:bg-bg-3 bg-bg-3-h5 h-8 max-w-[280px] min-w-0 flex-1 px-2 py-0"
          inputWrapClassName="h-full items-center"
          inputClassName="h-full leading-none text-xs font-normal"
          prefixClassname="flex items-center pr-1"
          placeholder={t`Search Pools`}
          variant="ghost"
          value={symbolFilterValue}
          onChange={(event) => {
            onSymbolFilterChange(event.target.value);
          }}
        />
        {!ready ? (
          <div className="flex shrink-0 items-center gap-2">
            <Label className="text-t-350 text-xs whitespace-nowrap">
              <Trans>In Wallet</Trans>
            </Label>
            <Skeleton className="h-4 w-7.5 rounded-full" />
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Label
              htmlFor="asset-mode"
              className="text-t-350 text-xs whitespace-nowrap"
            >
              <Trans>In Wallet</Trans>
            </Label>
            <Switch
              id="asset-mode"
              checked={inWalletOnly}
              onCheckedChange={onInWalletOnlyChange}
            />
          </div>
        )}
      </div>
    </div>
  );
});

type PoolsPaginationControlsProps = {
  paginationRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  pageNumbers: PageNumber[];
  currentPage: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
};

const PoolsPaginationControls = memo(function PoolsPaginationControls({
  paginationRef,
  className = 'absolute inset-x-0 bottom-3 z-20',
  pageNumbers,
  currentPage,
  canPreviousPage,
  canNextPage,
  onPrevious,
  onNext,
  onPageChange,
}: PoolsPaginationControlsProps) {
  return (
    <div ref={paginationRef} className={className}>
      <Pagination>
        <PaginationContent className="gap-[10px] py-1">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!canPreviousPage}
              tabIndex={canPreviousPage ? undefined : -1}
              className={cn(
                'text-t-350 hover:text-t-1100 size-4 rounded-none p-0 [&_svg]:size-4',
                !canPreviousPage && 'pointer-events-none opacity-40',
              )}
              onClick={(event) => {
                event.preventDefault();
                if (!canPreviousPage) return;
                onPrevious();
              }}
            />
          </PaginationItem>
          {pageNumbers.map((page) => {
            if (page === 'ellipsis-left' || page === 'ellipsis-right') {
              return (
                <PaginationItem key={page}>
                  <span className="text-t-350 flex size-8 items-center justify-center p-1 text-center text-sm/[1.2] font-medium">
                    &hellip;
                  </span>
                </PaginationItem>
              );
            }
            const pageNumber = page as number;
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === currentPage}
                  className={`size-8 rounded-xl border-0 p-1 text-sm/[1.2] font-medium ${
                    pageNumber === currentPage
                      ? 'bg-bg-3 text-t-1100 hover:bg-bg-3 hover:text-t-1100'
                      : 'text-t-350 hover:text-t-1100 bg-transparent hover:bg-transparent'
                  }`}
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={!canNextPage}
              tabIndex={canNextPage ? undefined : -1}
              className={cn(
                'text-t-350 hover:text-t-1100 size-4 rounded-none p-0 [&_svg]:size-4',
                !canNextPage && 'pointer-events-none opacity-40',
              )}
              onClick={(event) => {
                event.preventDefault();
                if (!canNextPage) return;
                onNext();
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
});

type PoolsMobileControlsProps = PoolsControlsProps & {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  selectCategoryLabel: string;
};

const PoolsMobileControls = memo(function PoolsMobileControls({
  isHydrated,
  value,
  options,
  onValueChange,
  symbolFilterValue,
  onSymbolFilterChange,
  ready,
  inWalletOnly,
  onInWalletOnlyChange,
  mobileOpen,
  onMobileOpenChange,
  selectCategoryLabel,
}: PoolsMobileControlsProps) {
  const { t } = useLingui();

  if (!isHydrated) {
    return <MobilePoolsControlsSkeleton />;
  }

  return (
    <>
      <Dialog open={mobileOpen} onOpenChange={onMobileOpenChange} modal>
        <DialogTrigger className="bg-bg-3-h5 flex w-full items-center justify-between rounded-xl px-4 py-[9.5px] text-sm font-medium">
          <span>{options.find((option) => option.value === value)?.label}</span>
          <ChevronDownIcon
            className={`transition-transform duration-300 ${mobileOpen ? '-rotate-180' : ''}`}
            size={16}
          />
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{selectCategoryLabel}</DialogTitle>
          <DialogDescription className="sr-only">
            {selectCategoryLabel}
          </DialogDescription>
          <div className="space-y-2">
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium ${
                    isActive ? 'bg-bg-4' : 'bg-transparent'
                  }`}
                  onClick={() => {
                    onValueChange(option.value as CATEGORY);
                    onMobileOpenChange(false);
                  }}
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-1 items-center gap-2">
        <Input
          prefix={<SearchIcon className="max-h-4 max-w-4" />}
          className="md:bg-bg-3 bg-bg-3-h5 h-8 min-w-4 flex-1 px-2 py-0"
          inputWrapClassName="h-full items-center"
          inputClassName="h-full leading-none text-xs font-normal"
          prefixClassname="flex items-center pr-1"
          placeholder={t`Search Pools`}
          variant="ghost"
          value={symbolFilterValue}
          onChange={(event) => {
            onSymbolFilterChange(event.target.value);
          }}
        />
        {!ready ? (
          <div className="flex items-center gap-2">
            <Label className="text-t-350 text-xs">
              <Trans>In Wallet</Trans>
            </Label>
            <Skeleton className="h-4 w-7.5 rounded-full" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Label htmlFor="asset-mode" className="text-t-350 text-xs">
              <Trans>In Wallet</Trans>
            </Label>
            <Switch
              id="asset-mode"
              checked={inWalletOnly}
              onCheckedChange={onInWalletOnlyChange}
            />
          </div>
        )}
      </div>
    </>
  );
});

type PoolsMobileResultsProps = {
  showMobileEmpty: boolean;
  mobileEmptyMessage: string;
  showWalletConnectEmpty: boolean;
  walletConnectEmptyMessage: string;
  items: PoolsListItem[];
};

const PoolsMobileResults = memo(function PoolsMobileResults({
  showMobileEmpty,
  mobileEmptyMessage,
  showWalletConnectEmpty,
  walletConnectEmptyMessage,
  items,
}: PoolsMobileResultsProps) {
  return (
    <div className="min-h-[440px] space-y-[10px] py-4">
      {showMobileEmpty ? (
        showWalletConnectEmpty ? (
          <div
            className={`flex items-center justify-center ${WALLET_EMPTY_LIST_HEIGHT_CLASS}`}
          >
            <WalletConnectEmptyState
              className="max-md:mt-0"
              message={walletConnectEmptyMessage}
            />
          </div>
        ) : (
          <div className="text-t-350 mt-6 flex h-20 items-center justify-center text-center text-sm">
            {mobileEmptyMessage}
          </div>
        )
      ) : (
        items.map((item, index) => (
          <MobilePoolCard
            key={item.marketAddress ?? `pool-card-${index}`}
            item={item}
          />
        ))
      )}
    </div>
  );
});

const desktopWalletEmptyHeaders = [
  { label: <Trans>Pool</Trans>, className: 'min-w-[180px] w-[180px] flex-1' },
  { label: <Trans>TVL</Trans>, className: 'min-w-[120px] w-[120px]' },
  { label: <Trans>Supply</Trans>, className: 'min-w-[140px] w-[140px]' },
  { label: <FeeApyHeader />, className: 'min-w-[120px] w-[120px]' },
  {
    label: <Trans>APR Snapshot</Trans>,
    className: 'min-w-[140px] w-[140px]',
  },
  {
    label: <Trans>Actions</Trans>,
    className: 'min-w-[90px] w-[90px] text-right',
  },
];

const DesktopWalletConnectEmptyState = memo(
  function DesktopWalletConnectEmptyState({ message }: { message: string }) {
    return (
      <div className="border-separate border-spacing-x-0 border-spacing-y-1 -translate-y-1">
        <div className="bg-bg-card-mix flex w-full border-b text-center">
          {desktopWalletEmptyHeaders.map((column, index) => (
            <div
              key={index}
              className={`text-t-350 bg-bg-card-mix py-2 text-left text-xs font-normal first:pl-2 last:pr-2 ${column.className}`}
            >
              {column.label}
            </div>
          ))}
        </div>
        <div
          className={`flex items-center justify-center ${WALLET_EMPTY_LIST_HEIGHT_CLASS}`}
        >
          <WalletConnectEmptyState className="h-auto" message={message} />
        </div>
      </div>
    );
  },
);

const DEFAULT_SORT_BY: PoolsListSortBy = 'tvl_usd';
const DEFAULT_SORT_ORDER: PoolsListSortOrder = 'desc';

const usePoolsListController = (
  initialData?: Awaited<ReturnType<typeof fetchPoolsList>>,
) => {
  const { i18n, t } = useLingui();
  const isHydrated = useHydrated();
  const [value, setValue] = useState(CATEGORY.all);
  const [symbolFilterValue, setSymbolFilterValue] = useState('');
  const [sortBy, setSortBy] = useState<PoolsListSortBy>(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] =
    useState<PoolsListSortOrder>(DEFAULT_SORT_ORDER);
  const [isSessionStateReady, setIsSessionStateReady] = useState(false);
  const { push } = useRouter();
  const pathname = usePathname();
  const isActive = useMemo(
    () => /\/pools(\/|$)/.test(pathname ?? ''),
    [pathname],
  );
  const { ready } = usePrivy();
  const walletAddress = useCurrentAccountAddress();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    marketAddress: false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [inWalletOnly, setInWalletOnly] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const poolFavorites = usePoolFavoritesStore((state) => state.favorites);
  const {
    ready: poolCategoryAvailabilityReady,
    categories: availablePoolCategories,
  } = usePoolsCategoryAvailability(isActive && isSessionStateReady);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const categoryOptions = useMemo(
    () =>
      POOLS_CATEGORY_VALUES.filter(
        (category) =>
          category === CATEGORY.all ||
          category === CATEGORY.favorites ||
          !poolCategoryAvailabilityReady ||
          availablePoolCategories.has(category),
      ).map((category) => ({
        value: category,
        label: i18n._(getCategoryLabelMessage(category)),
      })),
    [availablePoolCategories, i18n, poolCategoryAvailabilityReady],
  );

  useEffect(() => {
    if (
      !poolCategoryAvailabilityReady ||
      value === CATEGORY.all ||
      value === CATEGORY.favorites ||
      availablePoolCategories.has(value)
    ) {
      return;
    }

    setValue(CATEGORY.all);
  }, [availablePoolCategories, poolCategoryAvailabilityReady, value]);

  useEffect(() => {
    const storedState = readPoolsListSessionState();
    setValue(storedState.category ?? CATEGORY.all);
    setInWalletOnly(storedState.inWalletOnly ?? false);
    setSortBy(storedState.sortBy ?? DEFAULT_SORT_BY);
    setSortOrder(storedState.sortOrder ?? DEFAULT_SORT_ORDER);
    setIsSessionStateReady(true);
  }, []);

  useEffect(() => {
    if (!isSessionStateReady) return;
    writePoolsListSessionState({
      category: value,
      inWalletOnly,
      sortBy,
      sortOrder,
    });
  }, [inWalletOnly, isSessionStateReady, sortBy, sortOrder, value]);

  const scrollToTop = useCallback(() => {
    if (!listContainerRef.current) return;
    const container = listContainerRef.current.querySelector<HTMLDivElement>(
      '[data-slot="table-container"]',
    );
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof listContainerRef.current.scrollTo === 'function') {
      listContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const favoriteAddresses = useMemo(() => {
    const addresses: string[] = [];
    for (const [address, isFavorited] of poolFavorites.entries()) {
      if (isFavorited) {
        addresses.push(address);
      }
    }
    return addresses;
  }, [poolFavorites]);

  const isFavoritesTab = value === CATEGORY.favorites;
  const shouldSkipFavorites = isFavoritesTab && favoriteAddresses.length === 0;
  const showWalletConnectEmpty = inWalletOnly && ready && !walletAddress;
  const isWaitingForWalletState = inWalletOnly && !ready;
  const listQueryEnabled =
    isActive &&
    isSessionStateReady &&
    !shouldSkipFavorites &&
    !showWalletConnectEmpty &&
    !isWaitingForWalletState;
  const canUseInitialData =
    value === CATEGORY.all &&
    !symbolFilterValue &&
    !inWalletOnly &&
    pagination.pageIndex === 0 &&
    pagination.pageSize === DEFAULT_PAGE_SIZE &&
    sortBy === DEFAULT_SORT_BY &&
    sortOrder === DEFAULT_SORT_ORDER;

  const {
    data: poolsListData,
    totalCount,
    isLoading: isBaseListLoading,
  } = usePoolsListRows({
    initialData: canUseInitialData ? initialData : undefined,
    category: isFavoritesTab ? CATEGORY.all : value,
    search: symbolFilterValue || undefined,
    inWallet: inWalletOnly,
    favorites: isFavoritesTab ? favoriteAddresses : undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy,
    sortOrder,
    enabled: listQueryEnabled,
  });

  const items = useMemo(() => {
    if (
      shouldSkipFavorites ||
      showWalletConnectEmpty ||
      isWaitingForWalletState
    ) {
      return [];
    }
    return poolsListData;
  }, [
    isWaitingForWalletState,
    poolsListData,
    shouldSkipFavorites,
    showWalletConnectEmpty,
  ]);

  useEffect(() => {
    setPagination((prev) => {
      if (prev.pageIndex === 0) return prev;
      return { ...prev, pageIndex: 0 };
    });
  }, [inWalletOnly, sortBy, sortOrder, symbolFilterValue, value]);

  const handleRowClick = useCallback(
    (row: PoolsListItem) => {
      if (row.marketAddress) {
        push(`/pools/${row.marketAddress}`);
      }
    },
    [push],
  );

  const handleCategoryChange = useCallback((nextValue: CATEGORY) => {
    setValue(nextValue);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, []);

  const handleSymbolFilterChange = useCallback((rawValue: string) => {
    setSymbolFilterValue(validateSearchInput(rawValue));
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, []);

  const handleInWalletOnlyChange = useCallback((checked: boolean) => {
    setInWalletOnly(checked);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, []);

  const handleSortChange = useCallback(
    (nextSortBy: PoolsListSortBy) => {
      if (sortBy !== nextSortBy) {
        setSortBy(nextSortBy);
        setSortOrder(DEFAULT_SORT_ORDER);
        setPagination((prev) =>
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
        );
        return;
      }
      if (sortOrder === 'desc') {
        setSortOrder('asc');
        setPagination((prev) =>
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
        );
        return;
      }
      setSortBy(DEFAULT_SORT_BY);
      setSortOrder(DEFAULT_SORT_ORDER);
      setPagination((prev) =>
        prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
      );
    },
    [sortBy, sortOrder],
  );

  const columns = useMemo(
    () =>
      createColumns({
        sortBy,
        sortOrder,
        onSortChange: handleSortChange,
      }),
    [handleSortChange, sortBy, sortOrder],
  );

  const totalRows =
    shouldSkipFavorites || showWalletConnectEmpty || isWaitingForWalletState
      ? 0
      : totalCount;
  const hasPagination = totalRows > Math.max(1, pagination.pageSize);

  const totalPages =
    totalRows > 0 ? Math.ceil(totalRows / Math.max(1, pagination.pageSize)) : 1;
  const currentPage = pagination.pageIndex + 1;
  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;
  const showSkeleton =
    !isSessionStateReady || isBaseListLoading || isWaitingForWalletState;
  const showPagination = !showSkeleton && hasPagination;
  const mobileListItems = useMemo(() => {
    if (showSkeleton) return poolsListSkeletonRows;
    return items;
  }, [items, showSkeleton]);
  const walletConnectEmptyMessage = t`Please connect your wallet to continue.`;
  const mobileEmptyMessage = t`No matching results found.`;
  const showMobileEmpty = !showSkeleton && mobileListItems.length === 0;

  useEffect(() => {
    setPagination((prev) => {
      const safePageSize = Math.max(1, prev.pageSize);
      const maxPageIndex = Math.max(0, Math.ceil(totalRows / safePageSize) - 1);
      if (prev.pageIndex <= maxPageIndex) return prev;
      return {
        ...prev,
        pageIndex: maxPageIndex,
      };
    });
  }, [totalRows]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1) return;
      const safePage = Math.min(page, Math.max(1, totalPages));
      setPagination((prev) => {
        const nextPageIndex = safePage - 1;
        if (prev.pageIndex === nextPageIndex) return prev;
        return {
          ...prev,
          pageIndex: nextPageIndex,
        };
      });
      scrollToTop();
    },
    [scrollToTop, totalPages],
  );

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, handlePageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, handlePageChange, totalPages]);

  const pageNumbers = useMemo(
    () => createPageNumbers(totalPages, currentPage),
    [currentPage, totalPages],
  );

  return {
    isHydrated,
    value,
    categoryOptions,
    ready,
    inWalletOnly,
    handleInWalletOnlyChange,
    symbolFilterValue,
    handleCategoryChange,
    handleSymbolFilterChange,
    listContainerRef,
    showSkeleton,
    items,
    columns,
    rowSelection,
    setRowSelection,
    setColumnVisibility,
    columnVisibility,
    handleRowClick,
    showPagination,
    showWalletConnectEmpty,
    walletConnectEmptyMessage,
    paginationRef,
    pageNumbers,
    currentPage,
    canPreviousPage,
    canNextPage,
    handlePrevious,
    handleNext,
    handlePageChange,
    mobileOpen,
    setMobileOpen,
    mobileListItems,
    showMobileEmpty,
    mobileEmptyMessage,
    selectCategoryLabel: t`Select Category`,
  };
};

type PoolsListProps = {
  initialData?: Awaited<ReturnType<typeof fetchPoolsList>>;
};

export default function PoolsList({ initialData }: PoolsListProps) {
  const {
    isHydrated,
    value,
    categoryOptions,
    ready,
    inWalletOnly,
    handleInWalletOnlyChange,
    symbolFilterValue,
    handleCategoryChange,
    handleSymbolFilterChange,
    listContainerRef,
    showSkeleton,
    items,
    columns,
    rowSelection,
    setRowSelection,
    setColumnVisibility,
    columnVisibility,
    handleRowClick,
    showPagination,
    showWalletConnectEmpty,
    walletConnectEmptyMessage,
    paginationRef,
    pageNumbers,
    currentPage,
    canPreviousPage,
    canNextPage,
    handlePrevious,
    handleNext,
    handlePageChange,
    mobileOpen,
    setMobileOpen,
    mobileListItems,
    showMobileEmpty,
    mobileEmptyMessage,
    selectCategoryLabel,
  } = usePoolsListController(initialData);

  return (
    <>
      <div className="hidden min-w-0 flex-col gap-3 md:flex">
        <PoolsDesktopControls
          isHydrated={isHydrated}
          value={value}
          options={categoryOptions}
          onValueChange={handleCategoryChange}
          symbolFilterValue={symbolFilterValue}
          onSymbolFilterChange={handleSymbolFilterChange}
          ready={ready}
          inWalletOnly={inWalletOnly}
          onInWalletOnlyChange={handleInWalletOnlyChange}
        />
        <div
          className="relative min-h-[520px] overflow-hidden"
          ref={listContainerRef}
        >
          {showSkeleton ? (
            <DesktopPoolsTableSkeleton />
          ) : showWalletConnectEmpty ? (
            <DesktopWalletConnectEmptyState
              message={walletConnectEmptyMessage}
            />
          ) : (
            <Table
              columns={columns}
              data={items}
              isLoading={false}
              rowSelection={rowSelection}
              setRowSelection={setRowSelection}
              setColumnVisibility={setColumnVisibility}
              columnVisibility={columnVisibility}
              noBorder
              disableShadow
              outerClassName="h-auto min-h-[520px]"
              bodyCellClassName="py-1"
              onRowClick={handleRowClick}
              wrapClassName={
                showPagination
                  ? 'h-auto overflow-visible pb-12'
                  : 'h-auto overflow-visible pb-0'
              }
            />
          )}
          {showPagination ? (
            <PoolsPaginationControls
              paginationRef={paginationRef}
              pageNumbers={pageNumbers}
              currentPage={currentPage}
              canPreviousPage={canPreviousPage}
              canNextPage={canNextPage}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onPageChange={handlePageChange}
            />
          ) : null}
        </div>
      </div>

      {/* // For Mobile */}
      <div className="block px-4 pb-16 md:hidden">
        <div className="space-y-3">
          <PoolsMobileControls
            isHydrated={isHydrated}
            value={value}
            options={categoryOptions}
            onValueChange={handleCategoryChange}
            symbolFilterValue={symbolFilterValue}
            onSymbolFilterChange={handleSymbolFilterChange}
            ready={ready}
            inWalletOnly={inWalletOnly}
            onInWalletOnlyChange={handleInWalletOnlyChange}
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
            selectCategoryLabel={selectCategoryLabel}
          />
          <PoolsMobileResults
            showMobileEmpty={showMobileEmpty}
            mobileEmptyMessage={mobileEmptyMessage}
            showWalletConnectEmpty={showWalletConnectEmpty}
            walletConnectEmptyMessage={walletConnectEmptyMessage}
            items={mobileListItems}
          />
          {showPagination && !showMobileEmpty ? (
            <PoolsPaginationControls
              className="relative z-20 py-2 max-md:z-10"
              pageNumbers={pageNumbers}
              currentPage={currentPage}
              canPreviousPage={canPreviousPage}
              canNextPage={canNextPage}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onPageChange={handlePageChange}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
