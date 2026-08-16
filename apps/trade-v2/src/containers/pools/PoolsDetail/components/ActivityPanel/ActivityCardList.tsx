import {
  FC,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { formatAmount, USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans, useLingui } from '@lingui/react/macro';
import { dateFormat, EMPTY_DISPLAY, unitFormat } from '@repo/lib/format';
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  Dialog,
  DialogContent,
  DialogTitle,
  SkeletonLayout,
  XIcon,
} from '@repo/ui';
import {
  ConnectBtn,
  HZLP_TOKEN_DECIMALS,
  ZERO_STR,
  useCurrentAccountAddress,
  useHzSdk,
} from '@/common';
import {
  getLiquidityHistoryDetails,
  getLiquiditySummaryValue,
  hasSuccessfulLiquidityDetails,
} from '@/common/utils/liquidityHistory';
import { SHOW_LP_PENDING_ORDERS } from '@/constants/common';
import { convertBigintToHumanReadable } from '@/lib/shared/utils';
import {
  HistoryStatus,
  type HistoryItem,
  type HistoryItemDetail,
} from '@/services/rest/pools';
import { HZLP_NAME, LiqTradeType } from '@/stores/pools/trade';
import {
  ActionFilter,
  ActivityTabType,
  getActionFilterOptions,
  ModeType,
} from './types';

interface ActivityCardListProps {
  type?: ActivityTabType;
  mode: ModeType;
  items: HistoryItem[];
  isInitialLoading: boolean;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
  showActionFilter?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

const ACTIVITY_CARD_SKELETON_COUNT = 5;
const ACTIVITY_CARD_SKELETON_IDS = Array.from(
  { length: ACTIVITY_CARD_SKELETON_COUNT },
  (_, index) => `activity-card-skeleton-${index}`,
);

const ActivityCardSkeleton = () => (
  <div className="flex items-center justify-between gap-3 px-0 py-2">
    <div className="flex items-center gap-2">
      <SkeletonLayout isLoading className="size-6 rounded-full" />
      <div className="flex flex-col gap-1">
        <SkeletonLayout isLoading className="h-4 w-16" />
        <SkeletonLayout isLoading className="h-4 w-24" />
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <SkeletonLayout isLoading className="h-4 w-20" />
      <SkeletonLayout isLoading className="h-3 w-28" />
    </div>
  </div>
);

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

function ActivityCardActionFilter({
  value,
  onChange,
}: {
  value: ActionFilter;
  onChange: (filter: ActionFilter) => void;
}) {
  return (
    <div className="bg-bg-3 flex w-fit items-center gap-1 rounded-xl p-1">
      {getActionFilterOptions(SHOW_LP_PENDING_ORDERS).map((filter) => (
        <button
          key={filter}
          type="button"
          className={`rounded-lg px-2 py-1 text-xs ${
            value === filter
              ? 'bg-bg-4 text-t-1100'
              : 'text-t-270 hover:text-t-1100'
          }`}
          onClick={() => onChange(filter)}
        >
          {ACTION_FILTER_LABEL[filter]}
        </button>
      ))}
    </div>
  );
}

const VaultMobileExpandIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className="text-t-270"
  >
    <g opacity="0.3">
      <path
        d="M9.92 4.67L7 8.17L4.08 4.67"
        stroke="currentColor"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const ActivityEmptyIcon: FC = () => (
  <svg
    width="50"
    height="37"
    viewBox="0 0 50 37"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.291714"
      y="0.505263"
      width="22.9053"
      height="19.5368"
      rx="2.35789"
      transform="matrix(0.87 0.5 -2.2e-08 1 21.54 4.83)"
      fill="url(#paint0_linear_13730_26292)"
      stroke="url(#paint1_linear_13730_26292)"
      strokeWidth="0.673684"
    />
    <rect
      x="0.291714"
      y="0.505263"
      width="22.9053"
      height="19.5368"
      rx="2.35789"
      transform="matrix(0.87 0.5 -2.2e-08 1 28.93 4.83)"
      fill="url(#paint2_linear_13730_26292)"
      stroke="url(#paint3_linear_13730_26292)"
      strokeWidth="0.673684"
    />
    <rect
      x="0.291714"
      y="0.505263"
      width="22.9053"
      height="19.5368"
      rx="2.35789"
      transform="matrix(0.87 0.5 -2.2e-08 1 14.82 -1.17)"
      fill="url(#paint4_linear_13730_26292)"
      stroke="url(#paint5_linear_13730_26292)"
      strokeWidth="0.673684"
    />
    <rect
      x="0.291714"
      y="0.505263"
      width="22.9053"
      height="19.5368"
      rx="2.35789"
      transform="matrix(0.87 0.5 -2.2e-08 1 7.43 4.83)"
      fill="url(#paint6_linear_13730_26292)"
      stroke="url(#paint7_linear_13730_26292)"
      strokeWidth="0.673684"
    />
    <rect
      x="0.291714"
      y="0.505263"
      width="22.9053"
      height="19.5368"
      rx="2.35789"
      transform="matrix(0.87 0.5 -2.2e-08 1 0.04 4.83)"
      fill="url(#paint8_linear_13730_26292)"
      stroke="url(#paint9_linear_13730_26292)"
      strokeWidth="0.673684"
    />
    <defs>
      <linearGradient
        id="paint0_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00DFEB" stopOpacity="0.4" />
        <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00DFEB" stopOpacity="0.4" />
        <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient
        id="paint3_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient
        id="paint4_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00DFEB" />
        <stop offset="1" stopColor="#00DFEB" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient
        id="paint5_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient
        id="paint6_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00DFEB" stopOpacity="0.4" />
        <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient
        id="paint7_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient
        id="paint8_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00DFEB" stopOpacity="0.4" />
        <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient
        id="paint9_linear_13730_26292"
        x1="11.7895"
        y1="0"
        x2="11.7895"
        y2="20.2105"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" stopOpacity="0.1" />
        <stop offset="1" stopColor="white" stopOpacity="0.03" />
      </linearGradient>
    </defs>
  </svg>
);

const formatTimestamp = (value?: number | string) => {
  if (!value) return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return '-';
  return dateFormat(num > 1e12 ? num : num * 1000, 'yyyy/MM/dd HH:mm:ss');
};

const formatAddress = (address?: string | null) => {
  if (!address) return '-';
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const isZeroBigintString = (value?: string) => {
  try {
    return BigInt(value ?? ZERO_STR) === 0n;
  } catch {
    return true;
  }
};

const hasMultiDetails = (item: HistoryItem) =>
  (getLiquidityHistoryDetails(item)?.length ?? 0) > 1;

type AggregateStatus =
  | 'processing'
  | 'success'
  | 'partial'
  | 'partial-success'
  | 'partial-cancelled'
  | 'cancelled'
  | 'failed';

const AGGREGATE_STATUS_CLASS: Record<AggregateStatus, string> = {
  processing: 'text-warning',
  success: 'text-accent',
  partial: 'text-warning',
  'partial-success': 'text-warning',
  'partial-cancelled': 'text-warning',
  cancelled: 'text-destructive',
  failed: 'text-destructive',
};

const isPartialAggregateStatus = (status: AggregateStatus) =>
  status === 'partial' ||
  status === 'partial-success' ||
  status === 'partial-cancelled';

const normalizeHistoryStatus = (status?: string | null) =>
  (status ?? '').trim().toLowerCase();

const isPendingHistoryItem = (item: HistoryItem) =>
  normalizeHistoryStatus(item.status) === HistoryStatus.Pending ||
  (getLiquidityHistoryDetails(item)?.some(
    (detail) => normalizeHistoryStatus(detail.status) === HistoryStatus.Pending,
  ) ??
    false);

const isSuccessDetail = (detail: HistoryItemDetail) =>
  normalizeHistoryStatus(detail.status) === HistoryStatus.Success;

const isCancelledDetail = (detail: HistoryItemDetail) =>
  normalizeHistoryStatus(detail.status) === HistoryStatus.Cancelled;

const isFailedDetail = (detail: HistoryItemDetail) => {
  const status = normalizeHistoryStatus(detail.status);
  return status === 'failed';
};

const isFullyCancelledAggregate = (item: HistoryItem) =>
  hasMultiDetails(item) &&
  getLiquidityHistoryDetails(item)!.every(
    (detail) =>
      normalizeHistoryStatus(detail.status) === HistoryStatus.Cancelled,
  );

const getAggregateProgress = (item: HistoryItem) => {
  if (!hasMultiDetails(item)) return null;

  const details = getLiquidityHistoryDetails(item)!;
  const totalCount = details.length;
  const successCount = details.filter(isSuccessDetail).length;
  const cancelledCount = details.filter(isCancelledDetail).length;
  const failedCount = details.filter(isFailedDetail).length;
  const resolvedCount = successCount + cancelledCount + failedCount;
  const partialStatus =
    successCount > 0
      ? ('partial-success' as const)
      : cancelledCount > 0
        ? ('partial-cancelled' as const)
        : ('partial' as const);

  if (resolvedCount < totalCount) {
    return {
      status: resolvedCount > 0 ? partialStatus : ('processing' as const),
      resolvedCount,
      totalCount,
    };
  }

  if (cancelledCount === totalCount) {
    return { status: 'cancelled' as const, resolvedCount, totalCount };
  }

  if (successCount === totalCount) {
    return { status: 'success' as const, resolvedCount, totalCount };
  }

  if (successCount > 0) {
    return { status: 'partial-success' as const, resolvedCount, totalCount };
  }

  if (cancelledCount > 0) {
    return {
      status: 'partial-cancelled' as const,
      resolvedCount,
      totalCount,
    };
  }

  return { status: 'failed' as const, resolvedCount, totalCount };
};

const AggregateProgressLabel = ({
  progress,
}: {
  progress: NonNullable<ReturnType<typeof getAggregateProgress>>;
}) => {
  if (progress.status === 'processing') {
    const { resolvedCount, totalCount } = progress;
    return (
      <Trans>
        Processing ({resolvedCount}/{totalCount})
      </Trans>
    );
  }

  if (progress.status === 'success') {
    return <Trans>Success</Trans>;
  }

  if (progress.status === 'partial-success') {
    return (
      <Trans context="Liquidity aggregate partial success">Partial</Trans>
    );
  }

  if (progress.status === 'partial-cancelled') {
    return (
      <Trans context="Liquidity aggregate partial cancellation">
        Partial
      </Trans>
    );
  }

  if (progress.status === 'partial') {
    return <Trans>Partial</Trans>;
  }

  if (progress.status === 'cancelled') {
    return <Trans>Cancelled</Trans>;
  }

  return <Trans>Failed</Trans>;
};

const DETAIL_STATUS_LABEL: Record<string, string> = {
  success: 'Success',
  pending: 'Pending',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

const DetailSheet: FC<{
  details: HistoryItemDetail[];
  explorerHost: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ details, explorerHost, open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      position="bottom"
      closeClassName="hidden"
      className="!rounded-t-2xl !rounded-b-none !p-4"
      aria-describedby={undefined}
    >
      <div className="flex items-center justify-between">
        <DialogTitle className="text-t-1100 text-lg font-semibold">
          <Trans>Details</Trans>
        </DialogTitle>
        <button
          className="flex size-6 items-center justify-center"
          onClick={() => onOpenChange(false)}
        >
          <XIcon size={14} />
        </button>
      </div>

      <div className="text-t-270 flex items-center justify-between text-sm">
        <span>
          <Trans>Pool</Trans>
        </span>
        <span>
          <Trans>Shares/Value</Trans>
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {details.map((detail, idx) => {
          const detailStatus = normalizeHistoryStatus(
            detail.status || 'pending',
          );
          const showDetailSharesSkeleton =
            detailStatus === HistoryStatus.Pending &&
            isZeroBigintString(detail.lp_shares);
          const showDetailValueSkeleton =
            detailStatus === HistoryStatus.Pending &&
            isZeroBigintString(detail.delta_usd);
          const detailShares = formatAmount(
            BigInt(detail.lp_shares ?? ZERO_STR),
            HZLP_TOKEN_DECIMALS,
            4,
            true,
          );
          const detailValue = unitFormat(
            convertBigintToHumanReadable(
              BigInt(detail.delta_usd ?? ZERO_STR),
              USD_DECIMALS,
            ),
            2,
            {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
              stripTrailingZeros: true,
            },
          );
          const detailTimestamp = formatTimestamp(detail.timestamp);
          const detailHref =
            explorerHost && detail.executed_tx_hash
              ? `${explorerHost}/tx/${detail.executed_tx_hash}`
              : undefined;

          return (
            <div key={detail.key || idx}>
              {idx > 0 && <div className="bg-border mb-3 h-px w-full" />}
              <div className="flex items-start justify-between">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-t-1100 text-base font-medium">
                    {detail.symbol || '-'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`size-2 rounded-full ${
                        detailStatus === 'success'
                          ? 'bg-accent'
                          : detailStatus === 'pending'
                            ? 'bg-warning'
                            : 'bg-destructive'
                      }`}
                    />
                    <span className="text-sm">
                      {DETAIL_STATUS_LABEL[detailStatus] ?? detailStatus}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <SkeletonLayout
                    isLoading={showDetailSharesSkeleton}
                    className="bg-bg-4 h-5 w-24"
                  >
                    <span className="text-t-1100 text-base font-medium">
                      {detailShares} {HZLP_NAME}
                    </span>
                  </SkeletonLayout>
                  <SkeletonLayout
                    isLoading={showDetailValueSkeleton}
                    className="bg-bg-4 h-4 w-16"
                  >
                    <span className="text-t-350 text-sm">{detailValue}</span>
                  </SkeletonLayout>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-1">
                {detailHref ? (
                  <a
                    href={detailHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-t-350 flex items-center gap-1 text-xs"
                  >
                    {detailTimestamp}
                    <ArrowUpRightIcon size={14} className="opacity-30" />
                  </a>
                ) : (
                  <span className="text-t-350 text-xs">{detailTimestamp}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DialogContent>
  </Dialog>
);

const ActivityCardList: FC<ActivityCardListProps> = ({
  type,
  mode,
  items,
  isInitialLoading,
  scrollRootRef,
  actionFilter,
  onActionFilterChange,
  showActionFilter = true,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}) => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const address = useCurrentAccountAddress();
  const isMyMode = mode === ModeType.MY;
  const hasAddress = !!address;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [detailSheetItem, setDetailSheetItem] = useState<HistoryItem | null>(
    null,
  );

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !fetchNextPage) return;
    const el = sentinelRef.current;
    const root = scrollRootRef.current;
    if (!el || !root || typeof IntersectionObserver === 'undefined') return;
    let requested = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !requested) {
          requested = true;
          fetchNextPage();
        }
      },
      { root, rootMargin: '120px 0px 240px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, scrollRootRef]);

  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';
  const showUserAddress = mode === ModeType.ALL;
  const rows = (() => {
    const counts = new Map<string, number>();
    return items.map((it) => {
      const base = [
        it.executed_tx_hash,
        it.action,
        it.wallet_address,
        it.timestamp,
        it.lp_shares,
        it.delta_usd,
        it.fees_earned_usd,
        it.status,
        it.tx_hash,
      ].join(':');
      const next = (counts.get(base) ?? 0) + 1;
      counts.set(base, next);

      const isCancelled =
        it.status === HistoryStatus.Cancelled || isFullyCancelledAggregate(it);
      const label =
        isCancelled && it.action === LiqTradeType.Deposit
          ? t`Cancelled Deposit`
          : isCancelled && it.action === LiqTradeType.Withdraw
            ? t`Cancelled Withdrawal`
            : it.action === LiqTradeType.Deposit
          ? t`Deposit`
          : it.action === LiqTradeType.Withdraw
            ? t`Withdraw`
            : it.action;
      const aggregateProgress = getAggregateProgress(it);
      const hasSuccessfulAggregateDetail =
        !aggregateProgress || hasSuccessfulLiquidityDetails(it);
      const sharesValue = aggregateProgress
        ? getLiquiditySummaryValue(it, 'lp_shares')
        : it.lp_shares;
      const deltaUsdValue = aggregateProgress
        ? getLiquiditySummaryValue(it, 'delta_usd')
        : it.delta_usd;
      const showSharesSkeleton =
        isPendingHistoryItem(it) && isZeroBigintString(sharesValue);
      const showValueSkeleton =
        isPendingHistoryItem(it) && isZeroBigintString(deltaUsdValue);
      const shares = formatAmount(
        sharesValue,
        HZLP_TOKEN_DECIMALS,
        4,
        true,
        '--',
      );
      const deltaUsd =
        deltaUsdValue === undefined
          ? EMPTY_DISPLAY
          : unitFormat(
              convertBigintToHumanReadable(
                BigInt(deltaUsdValue),
                USD_DECIMALS,
              ),
              2,
              {
                style: 'currency',
                currency: 'USD',
                showMinDecimalValue: true,
                stripTrailingZeros: true,
              },
            );
      let earnedUsd = 0n;
      try {
        earnedUsd = BigInt(it.fees_earned_usd ?? ZERO_STR);
      } catch {
        earnedUsd = 0n;
      }
      const earnedUsdHuman = convertBigintToHumanReadable(
        earnedUsd,
        USD_DECIMALS,
      );
      const formattedEarnedUsd = unitFormat(earnedUsdHuman, 2, {
        style: 'currency',
        currency: 'USD',
        showMinDecimalValue: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'always',
      });
      const timestamp = formatTimestamp(it.timestamp);
      const txHref =
        explorerHost && it.executed_tx_hash
          ? `${explorerHost}/tx/${it.executed_tx_hash}`
          : undefined;
      const userHref =
        explorerHost && it.wallet_address
          ? `${explorerHost}/address/${it.wallet_address}`
          : undefined;

      return {
        item: it,
        key: next === 1 ? base : `${base}:${next}`,
        label,
        aggregateProgress,
        hasSuccessfulAggregateDetail,
        showSharesSkeleton,
        showValueSkeleton,
        shares,
        deltaUsd,
        earnedUsd,
        formattedEarnedUsd,
        isCancelled,
        timestamp,
        txHref,
        userHref,
        showUserAddress,
        isExpandable: hasMultiDetails(it),
      };
    });
  })();
  const detailSheetDetails = detailSheetItem
    ? getLiquidityHistoryDetails(detailSheetItem)
    : undefined;

  if (isInitialLoading && items.length === 0) {
    return (
      <div className="space-y-2">
        {showActionFilter ? (
          <ActivityCardActionFilter
            value={actionFilter}
            onChange={onActionFilterChange}
          />
        ) : null}
        {ACTIVITY_CARD_SKELETON_IDS.map((id) => (
          <ActivityCardSkeleton key={id} />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="space-y-2">
        {showActionFilter ? (
          <ActivityCardActionFilter
            value={actionFilter}
            onChange={onActionFilterChange}
          />
        ) : null}
        {!hasAddress && isMyMode ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <ActivityEmptyIcon />
            <div className="text-sm font-medium">
              <Trans>Please connect your wallet to continue.</Trans>
            </div>
            <ConnectBtn className="max-md:!text-accent w-[220px] max-w-[60vw] text-xs underline-offset-2 max-md:size-auto max-md:!bg-transparent max-md:p-0 max-md:text-sm max-md:underline" />
          </div>
        ) : actionFilter !== ActionFilter.ALL ? (
          <div className="text-t-350 flex items-center justify-center py-10 text-sm">
            <Trans>No matching records found.</Trans>
          </div>
        ) : (
          <div className="text-t-350 flex items-center justify-center py-10 text-sm">
            <Trans>No Liquidity activity found.</Trans>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showActionFilter ? (
        <ActivityCardActionFilter
          value={actionFilter}
          onChange={onActionFilterChange}
        />
      ) : null}
      {rows.map(
        ({
          item,
          key,
          label,
          aggregateProgress,
          hasSuccessfulAggregateDetail,
          showSharesSkeleton,
          showValueSkeleton,
          shares,
          deltaUsd,
          earnedUsd,
          formattedEarnedUsd,
          isCancelled,
          timestamp,
          txHref,
          userHref,
          showUserAddress,
          isExpandable,
        }) => {
          const openDetailSheet = () => setDetailSheetItem(item);
          const rowContent = (
            <>
              <div className="flex items-center gap-2">
                <div>
                  {item.action === LiqTradeType.Deposit ? (
                    <CircleArrowDownIcon size={24} />
                  ) : (
                    <CircleArrowUpIcon size={24} />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-medium capitalize">{label}</div>
                  {aggregateProgress &&
                  isPartialAggregateStatus(aggregateProgress.status) ? (
                    <div
                      className={`text-xs ${AGGREGATE_STATUS_CLASS[aggregateProgress.status]}`}
                    >
                      <AggregateProgressLabel progress={aggregateProgress} />
                    </div>
                  ) : null}
                  <SkeletonLayout
                    isLoading={showSharesSkeleton}
                    className="h-4 w-24"
                  >
                    <div className="text-xs">
                      {`${shares} ${HZLP_NAME}`}
                    </div>
                  </SkeletonLayout>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <SkeletonLayout
                    isLoading={showValueSkeleton}
                    className="h-4 w-20"
                  >
                    <div className="text-xs">
                      {deltaUsd}
                      {item.action === LiqTradeType.Withdraw &&
                      !isCancelled &&
                      hasSuccessfulAggregateDetail ? (
                        <span
                          className={
                            earnedUsd > 0n
                              ? 'text-up ml-1'
                              : earnedUsd < 0n
                                ? 'text-down ml-1'
                                : 'text-t-350 ml-1'
                          }
                        >
                          {formattedEarnedUsd}
                        </span>
                      ) : null}
                    </div>
                  </SkeletonLayout>
                  {txHref ? (
                    <a
                      href={txHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-t-350 text-xs underline decoration-dotted underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {timestamp}
                    </a>
                  ) : (
                    <div className="text-t-350 text-xs">{timestamp}</div>
                  )}
                  {showUserAddress ? (
                    userHref ? (
                      <a
                        href={userHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-t-350 text-xs underline decoration-dotted underline-offset-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatAddress(item.wallet_address)}
                      </a>
                    ) : (
                      <div className="text-t-350 text-xs">
                        {formatAddress(item.wallet_address)}
                      </div>
                    )
                  ) : null}
                </div>
                {isExpandable ? (
                  <span
                    className="inline-flex size-3.5 items-center justify-center"
                    aria-hidden="true"
                  >
                    {type === ActivityTabType.VAULT ? (
                      <VaultMobileExpandIcon />
                    ) : (
                      <ChevronRightIcon className="text-t-270 size-3.5 opacity-30" />
                    )}
                  </span>
                ) : null}
              </div>
            </>
          );

          return (
            <div key={key}>
              {isExpandable ? (
                <div
                  className="flex min-h-[60px] items-start justify-between gap-3 px-0 py-2"
                  role="button"
                  tabIndex={0}
                  onClick={openDetailSheet}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openDetailSheet();
                    }
                  }}
                >
                  {rowContent}
                </div>
              ) : (
                <div className="flex min-h-[60px] items-start justify-between gap-3 px-0 py-2">
                  {rowContent}
                </div>
              )}
            </div>
          );
        },
      )}
      {detailSheetDetails ? (
        <DetailSheet
          details={[...detailSheetDetails]}
          explorerHost={explorerHost ?? ''}
          open={!!detailSheetItem}
          onOpenChange={(open) => {
            if (!open) setDetailSheetItem(null);
          }}
        />
      ) : null}
      {hasNextPage ? <div ref={sentinelRef} /> : null}
      {isFetchingNextPage ? (
        <div className="text-t-270 py-2 text-center text-xs">
          <Trans>Loading…</Trans>
        </div>
      ) : null}
    </div>
  );
};

export default ActivityCardList;
