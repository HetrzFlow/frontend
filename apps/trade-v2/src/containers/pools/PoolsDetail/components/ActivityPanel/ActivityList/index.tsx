'use client';

import {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { formatAmount, USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans, useLingui } from '@lingui/react/macro';
import { ColumnDef } from '@tanstack/react-table';
import { dateFormat, EMPTY_DISPLAY, unitFormat } from '@repo/lib/format';
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CircleArrowDownIcon,
  CircleArrowUpIcon,
  CheckIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SkeletonLayout,
} from '@repo/ui';
import {
  useCurrentAccountAddress,
  HZLP_TOKEN_DECIMALS,
  ZERO_STR,
  useHzSdk,
  ConnectBtn,
} from '@/common';
import {
  getLiquidityHistoryDetails,
  getLiquiditySummaryValue,
  hasSuccessfulLiquidityDetails,
} from '@/common/utils/liquidityHistory';
import Table from '@/components/Table';
import { SHOW_LP_PENDING_ORDERS } from '@/constants/common';
import { convertBigintToHumanReadable } from '@/lib/shared/utils';
import {
  HistoryStatus,
  type HistoryItem,
  type HistoryItemDetail,
} from '@/services/rest/pools';
import { HZLP_NAME, LiqTradeType } from '@/stores/pools/trade';
import { ActionFilter, getActionFilterOptions, ModeType } from '../types';

interface ActivityListProps {
  mode: ModeType;
  items: HistoryItem[];
  isInitialLoading: boolean;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

type ActivityRow = HistoryItem & { __rowId: string; __isSkeleton?: boolean };

const ACTIVITY_SKELETON_ROW_COUNT = 5;

const skeletonRows: ActivityRow[] = Array.from(
  { length: ACTIVITY_SKELETON_ROW_COUNT },
  (_, index) => ({
    __rowId: `activity-skeleton-${index}`,
    __isSkeleton: true,
    action: LiqTradeType.Deposit,
    status: HistoryStatus.Pending,
    tx_hash: '',
    executed_tx_hash: undefined,
    wallet_address: '',
    lp_shares: ZERO_STR,
    delta_usd: ZERO_STR,
    fees_earned_usd: ZERO_STR,
    timestamp: 0,
  }),
);

export const ActivityEmptyIcon: FC = () => (
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

const DETAIL_STATUS_CLASS: Record<string, string> = {
  success: 'text-accent',
  pending: 'text-[#FC0]',
  cancelled: 'text-[#FF4C61]',
  failed: 'text-[#FF4C61]',
};

const DETAIL_STATUS_LABEL: Record<string, string> = {
  success: 'Success',
  pending: 'Pending',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

const DETAIL_STATUS_ICON_FILL: Record<string, string> = {
  success: '#00DFEB',
  pending: '#FFBF00',
  cancelled: '#FC495C',
  failed: '#FC495C',
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
  processing: 'text-[#FC0]',
  success: 'text-accent',
  partial: 'text-[#FC0]',
  'partial-success': 'text-[#FC0]',
  'partial-cancelled': 'text-[#FC0]',
  cancelled: 'text-[#FF4C61]',
  failed: 'text-[#FF4C61]',
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

interface TimeHashCellProps {
  row: ActivityRow;
  href?: string;
  isOpen: boolean;
  onToggle: (rowId: string) => void;
}

const TimeHashCell = ({ row, href, isOpen, onToggle }: TimeHashCellProps) => {
  const formatted = formatTimestamp(row.timestamp);
  const isExpandable = hasMultiDetails(row);

  if (isExpandable) {
    return (
      <button
        type="button"
        className="group/inner ml-auto inline-flex items-center gap-[2px]"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(row.__rowId);
        }}
      >
        <span className="font-plex">{formatted}</span>
        <ChevronDownIcon
          className={`text-t-430 group-hover/inner:text-t-1100 size-[14px] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    );
  }

  if (href) {
    return (
      <button
        type="button"
        className="group/inner ml-auto inline-flex items-center gap-[2px]"
        onClick={(e) => {
          e.stopPropagation();
          window.open(href, '_blank', 'noopener,noreferrer');
        }}
      >
        <span className="font-plex">{formatted}</span>
        <span className="text-t-430 group-hover/inner:text-t-1100">
          <ArrowUpRightIcon size={14} />
        </span>
      </button>
    );
  }

  return <span className="font-plex ml-auto">{formatted}</span>;
};

const DETAILS_TABLE_GRID_CLASS =
  'grid w-full grid-cols-[28px_minmax(0,1.12fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] items-center justify-items-start text-left';

const formatCompactShares = (value?: string) =>
  unitFormat(
    convertBigintToHumanReadable(
      BigInt(value ?? ZERO_STR),
      HZLP_TOKEN_DECIMALS,
    ),
    2,
    {
      showMinDecimalValue: true,
      stripTrailingZeros: true,
      unitDecimal: 2,
    },
  );

const ExpandableDetailsTable: FC<{
  details: HistoryItemDetail[];
  explorerHost: string;
}> = ({ details, explorerHost }) => (
  <div className="bg-border flex flex-col gap-0.5 rounded-[10px] px-3 py-2">
    <div className={`${DETAILS_TABLE_GRID_CLASS} text-t-350 px-2 text-xs`}>
      <span>#</span>
      <span className="min-w-0 justify-self-stretch text-left">
        <Trans>Pool</Trans>
      </span>
      <span className="min-w-0 justify-self-stretch text-left">
        <Trans>Status</Trans>
      </span>
      <span className="min-w-0 justify-self-stretch text-left">
        <Trans>Shares</Trans>
      </span>
      <span className="min-w-0 justify-self-stretch text-left">
        <Trans>Value</Trans>
      </span>
      <span className="min-w-0 justify-self-stretch text-right">
        <Trans>Time / Hash</Trans>
      </span>
    </div>
    <div className="bg-border-2 h-px" />
    <div className="flex flex-col">
      {details.map((detail, idx) => {
        const status = normalizeHistoryStatus(detail.status || 'pending');
        const showSharesSkeleton =
          status === HistoryStatus.Pending &&
          isZeroBigintString(detail.lp_shares);
        const showValueSkeleton =
          status === HistoryStatus.Pending &&
          isZeroBigintString(detail.delta_usd);
        const shares = formatCompactShares(detail.lp_shares);
        const value = unitFormat(
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
        const timestamp = formatTimestamp(detail.timestamp);
        const txHref = detail.executed_tx_hash
          ? `${explorerHost}/tx/${detail.executed_tx_hash}`
          : undefined;

        return (
          <div
            key={detail.key || idx}
            className={`${DETAILS_TABLE_GRID_CLASS} hover:bg-bg-3 rounded-lg p-2 text-xs`}
          >
            <span className="text-t-350">{idx + 1}</span>
            <span className="text-t-1100 min-w-0 justify-self-stretch truncate text-left font-medium">
              {detail.symbol || '-'}
            </span>
            <span
              className={`min-w-0 justify-self-stretch truncate text-left ${DETAIL_STATUS_CLASS[status] ?? 'text-t-1100'}`}
            >
              <span className="inline-flex min-w-0 items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  className="shrink-0"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle
                    cx="2"
                    cy="2"
                    r="2"
                    fill={DETAIL_STATUS_ICON_FILL[status] ?? '#FFBF00'}
                  />
                </svg>
                <span className="min-w-0 truncate">
                  {DETAIL_STATUS_LABEL[status] ?? status}
                </span>
              </span>
            </span>
            <SkeletonLayout
              isLoading={showSharesSkeleton}
              className="bg-bg-4 h-4 w-16"
            >
              <span className="text-t-1100 min-w-0 justify-self-stretch truncate text-left">
                {shares} {HZLP_NAME}
              </span>
            </SkeletonLayout>
            <SkeletonLayout
              isLoading={showValueSkeleton}
              className="bg-bg-4 h-4 w-24"
            >
              <span className="text-t-1100 min-w-0 justify-self-stretch text-left">
                {value}
              </span>
            </SkeletonLayout>
            <span className="w-full min-w-0 justify-self-stretch">
              {txHref ? (
                <button
                  type="button"
                  className="group/inner inline-flex w-full min-w-0 items-center justify-end gap-[2px]"
                  onClick={() =>
                    window.open(txHref, '_blank', 'noopener,noreferrer')
                  }
                >
                  <span className="truncate text-right">{timestamp}</span>
                  <span className="text-t-430 group-hover/inner:text-t-1100 inline-flex size-[14px] items-center justify-center">
                    <ArrowUpRightIcon size={10} />
                  </span>
                </button>
              ) : (
                <span className="text-t-1100 block truncate text-right">
                  {timestamp}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const ActivityActionCell = memo(function ActivityActionCell({
  row,
}: {
  row: ActivityRow;
}) {
  const { t } = useLingui();
  if (row.__isSkeleton) {
    return (
      <div className="flex items-center gap-2">
        <SkeletonLayout isLoading className="size-6 rounded-full" />
        <SkeletonLayout isLoading className="h-4 w-16" />
      </div>
    );
  }
  const action = row.action;
  const isCancelled =
    row.status === HistoryStatus.Cancelled || isFullyCancelledAggregate(row);
  const label =
    isCancelled && action === LiqTradeType.Deposit
      ? t`Cancelled Deposit`
      : isCancelled && action === LiqTradeType.Withdraw
        ? t`Cancelled Withdrawal`
        : action === LiqTradeType.Deposit
      ? t`Deposit`
      : action === LiqTradeType.Withdraw
        ? t`Withdraw`
        : action;
  const aggregateProgress = getAggregateProgress(row);
  return (
    <div className="flex items-center gap-2 font-medium capitalize">
      {action === LiqTradeType.Deposit ? (
        <CircleArrowDownIcon size={24} />
      ) : (
        <CircleArrowUpIcon size={24} />
      )}
      <div className="flex min-w-0 flex-col">
        <span>{label}</span>
        {aggregateProgress &&
        isPartialAggregateStatus(aggregateProgress.status) ? (
          <span
            className={`text-xs normal-case ${AGGREGATE_STATUS_CLASS[aggregateProgress.status]}`}
          >
            <AggregateProgressLabel progress={aggregateProgress} />
          </span>
        ) : null}
      </div>
    </div>
  );
});

const ActivitySharesCell = memo(function ActivitySharesCell({
  row,
}: {
  row: ActivityRow;
}) {
  if (row.__isSkeleton) {
    return <SkeletonLayout isLoading className="h-4 w-16" />;
  }
  const aggregateProgress = getAggregateProgress(row);
  const lp_shares = aggregateProgress
    ? getLiquiditySummaryValue(row, 'lp_shares')
    : row.lp_shares;
  const showSkeleton =
    isPendingHistoryItem(row) && isZeroBigintString(lp_shares);
  const formatted = formatAmount(
    lp_shares,
    HZLP_TOKEN_DECIMALS,
    4,
    true,
    '--',
  );
  return (
    <SkeletonLayout isLoading={showSkeleton} className="h-4 w-16">
      <div className="font-medium">{formatted}</div>
    </SkeletonLayout>
  );
});

const ActivityValueCell = memo(function ActivityValueCell({
  row,
}: {
  row: ActivityRow;
}) {
  if (row.__isSkeleton) {
    return <SkeletonLayout isLoading className="h-4 w-24" />;
  }
  const direction = row.action;
  const fees_earned_usd = row.fees_earned_usd;
  let earnedUsd = 0n;
  try {
    earnedUsd = BigInt(fees_earned_usd ?? ZERO_STR);
  } catch {
    earnedUsd = 0n;
  }
  const earnedUsdHuman = convertBigintToHumanReadable(earnedUsd, USD_DECIMALS);
  const aggregateProgress = getAggregateProgress(row);
  const hasSuccessfulAggregateDetail =
    !aggregateProgress || hasSuccessfulLiquidityDetails(row);
  const isCancelled =
    row.status === HistoryStatus.Cancelled || isFullyCancelledAggregate(row);
  const delta_usd = aggregateProgress
    ? getLiquiditySummaryValue(row, 'delta_usd')
    : row.delta_usd;
  const showSkeleton =
    isPendingHistoryItem(row) && isZeroBigintString(delta_usd);
  const valueText =
    delta_usd === undefined
      ? EMPTY_DISPLAY
      : unitFormat(
          convertBigintToHumanReadable(BigInt(delta_usd), USD_DECIMALS),
          2,
          {
            style: 'currency',
            currency: 'USD',
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          },
        );
  return (
    <SkeletonLayout isLoading={showSkeleton} className="h-4 w-24">
      <div className="font-medium">
        {valueText}
        {direction === LiqTradeType.Withdraw &&
        !isCancelled &&
        hasSuccessfulAggregateDetail ? (
          <span
            className={`${earnedUsd > 0n ? 'text-up' : earnedUsd < 0n ? 'text-down' : 'text-t-350'}`}
          >
            {' '}
            {unitFormat(earnedUsdHuman, 2, {
              style: 'currency',
              currency: 'USD',
              showMinDecimalValue: true,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              signDisplay: 'always',
            })}
          </span>
        ) : null}
      </div>
    </SkeletonLayout>
  );
});

const ActivityUserCell = memo(function ActivityUserCell({
  row,
  explorerHost,
}: {
  row: ActivityRow;
  explorerHost: string;
}) {
  if (row.__isSkeleton) {
    return <SkeletonLayout isLoading className="h-4 w-20" />;
  }
  const wallet_address = row.wallet_address;
  const href =
    explorerHost && wallet_address
      ? `${explorerHost}/address/${wallet_address}`
      : undefined;
  if (!wallet_address || !explorerHost)
    return (
      <div className="font-mono text-xs">{formatAddress(wallet_address)}</div>
    );

  return (
    <div className="text-xs">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {formatAddress(wallet_address)}
      </a>
    </div>
  );
});

type ActivityColumnsOptions = {
  explorerHost: string;
  expandedRows: Set<string>;
  toggleExpand: (rowId: string) => void;
  showUserColumn: boolean;
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
};

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

function ActivityActionHeader({
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
        {getActionFilterOptions(SHOW_LP_PENDING_ORDERS).map((filter) => (
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

const createActivityColumns = ({
  explorerHost,
  expandedRows,
  toggleExpand,
  showUserColumn,
  actionFilter,
  onActionFilterChange,
}: ActivityColumnsOptions): ColumnDef<ActivityRow>[] => {
  const activityColumns: ColumnDef<ActivityRow>[] = [
    {
      accessorKey: 'action',
      header: () => (
        <ActivityActionHeader
          actionFilter={actionFilter}
          onActionFilterChange={onActionFilterChange}
        />
      ),
      meta: {
        headerClassName: 'min-w-[140px]',
        bodyClassName: 'min-w-[140px]',
      },
      cell: ({ row }) => <ActivityActionCell row={row.original} />,
    },
    {
      accessorKey: 'lp_shares',
      header: () => <Trans>Shares</Trans>,
      meta: {
        headerClassName: 'min-w-[120px]',
        bodyClassName: 'min-w-[120px]',
      },
      cell: ({ row }) => <ActivitySharesCell row={row.original} />,
    },
    {
      accessorKey: 'delta_usd',
      header: () => <Trans>Value</Trans>,
      meta: {
        headerClassName: showUserColumn ? 'min-w-[80px]' : 'min-w-[160px]',
        bodyClassName: showUserColumn ? 'min-w-[80px]' : 'min-w-[160px]',
      },
      cell: ({ row }) => <ActivityValueCell row={row.original} />,
    },
  ];

  if (showUserColumn) {
    activityColumns.push({
      accessorKey: 'wallet_address',
      header: () => <Trans>User</Trans>,
      meta: {
        headerClassName: 'min-w-[120px]',
        bodyClassName: 'min-w-[120px]',
      },
      cell: ({ row }) => (
        <ActivityUserCell row={row.original} explorerHost={explorerHost} />
      ),
    });
  }

  activityColumns.push({
    accessorKey: 'timestamp',
    header: () => (
      <div className="text-right">
        <Trans>Time / Hash</Trans>
      </div>
    ),
    meta: {
      headerClassName: 'min-w-[150px]',
      bodyClassName: 'min-w-[150px]',
    },
    cell: ({ row }) => {
      if (row.original.__isSkeleton) {
        return (
          <div className="flex justify-end">
            <SkeletonLayout isLoading className="h-4 w-28" />
          </div>
        );
      }
      const { executed_tx_hash } = row.original;
      const href = executed_tx_hash
        ? `${explorerHost}/tx/${executed_tx_hash}`
        : undefined;
      return (
        <div className="flex items-center justify-end text-xs">
          <TimeHashCell
            row={row.original}
            href={href}
            isOpen={expandedRows.has(row.original.__rowId)}
            onToggle={toggleExpand}
          />
        </div>
      );
    },
  });

  return activityColumns;
};

const createActivityRows = (
  items: HistoryItem[],
  isInitialLoading: boolean,
): ActivityRow[] => {
  if (isInitialLoading) return skeletonRows;

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
    return { ...it, __rowId: next === 1 ? base : `${base}:${next}` };
  });
};

type ActivityTableViewProps = {
  columns: ColumnDef<ActivityRow>[];
  rows: ActivityRow[];
  emptyMessage: ReactNode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onRowClick: (row: ActivityRow) => void;
  renderExpandedDetails: (row: ActivityRow) => ReactNode;
};

const ActivityTableView = memo(function ActivityTableView({
  columns,
  rows,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  sentinelRef,
  onRowClick,
  renderExpandedDetails,
}: ActivityTableViewProps) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <Table
        columns={columns}
        data={rows}
        getRowId={(row) => row.__rowId}
        isLoading={false}
        onRowClick={onRowClick}
        emptyMessage={emptyMessage}
        noBorder
        outerClassName="h-full"
        headCellClassName="h-auto pt-0 pb-2 sticky top-0 z-30"
        bodyCellClassName="py-1"
        wrapClassName="h-auto min-h-full overflow-visible pb-0"
        emptyFullHeight
        extra={
          hasNextPage || isFetchingNextPage ? (
            <div className="flex flex-col items-center py-1">
              {hasNextPage ? (
                <div ref={sentinelRef} className="h-1 w-full" />
              ) : null}
              {isFetchingNextPage ? (
                <div className="text-t-270 py-1 text-xs">
                  <Trans>Loading…</Trans>
                </div>
              ) : null}
            </div>
          ) : null
        }
        renderSubRow={(row) => renderExpandedDetails(row as ActivityRow)}
      />
    </div>
  );
});

const ActivityList: FC<ActivityListProps> = ({
  mode,
  items,
  isInitialLoading,
  scrollRootRef,
  actionFilter,
  onActionFilterChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}) => {
  const hzSdk = useHzSdk();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const toggleExpand = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);
  const explorerHost = hzSdk
    ? (getViemChain(hzSdk.config.chainId).blockExplorers?.default.url ?? '')
    : '';

  const columns = useMemo(
    () =>
      createActivityColumns({
        explorerHost,
        expandedRows,
        toggleExpand,
        showUserColumn: mode === ModeType.ALL,
        actionFilter,
        onActionFilterChange,
      }),
    [
      actionFilter,
      explorerHost,
      expandedRows,
      mode,
      onActionFilterChange,
      toggleExpand,
    ],
  );
  const rows = useMemo(
    () => createActivityRows(items, isInitialLoading),
    [isInitialLoading, items],
  );
  const address = useCurrentAccountAddress();
  const isMyMode = mode === ModeType.MY;
  const hasAddress = !!address;
  const emptyMessage =
    !hasAddress && isMyMode ? (
      <div className="flex h-full flex-col items-center justify-center gap-3 max-md:mt-6">
        <ActivityEmptyIcon />
        <div className="text-sm font-medium max-md:text-sm">
          <Trans>Please connect your wallet to continue.</Trans>
        </div>
        <ConnectBtn className="max-md:!text-accent w-[220px] max-w-[50vw] text-xs underline-offset-2 max-md:size-auto max-md:!bg-transparent max-md:p-0 max-md:text-sm max-md:underline" />
      </div>
    ) : actionFilter !== ActionFilter.ALL ? (
      <div className="text-t-350 flex h-full items-center justify-center py-10 text-sm">
        <Trans>No matching records found.</Trans>
      </div>
    ) : (
      <div className="text-t-350 flex h-full items-center justify-center py-10 text-sm">
        <Trans>No Liquidity activity found.</Trans>
      </div>
    );

  const renderExpandedDetails = useCallback(
    (row: ActivityRow) => {
      if (!hasMultiDetails(row)) return null;
      if (!expandedRows.has(row.__rowId)) return null;
      const details = getLiquidityHistoryDetails(row);
      if (!details) return null;
      return (
        <ExpandableDetailsTable
          details={[...details]}
          explorerHost={explorerHost}
        />
      );
    },
    [expandedRows, explorerHost],
  );

  const handleRowClick = useCallback(
    (row: ActivityRow) => {
      if (row.__isSkeleton) return;
      if (!hasMultiDetails(row)) return;
      toggleExpand(row.__rowId);
    },
    [toggleExpand],
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

  return (
    <ActivityTableView
      columns={columns}
      rows={rows}
      emptyMessage={emptyMessage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      sentinelRef={sentinelRef}
      onRowClick={handleRowClick}
      renderExpandedDetails={renderExpandedDetails}
    />
  );
};

export default ActivityList;
