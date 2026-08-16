import type { ReactNode } from 'react';
import Image from 'next/image';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans } from '@lingui/react/macro';
import { ColumnDef, Row } from '@tanstack/react-table';
import { IMAGES_MAP } from '@repo/common';
import { calc } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import {
  SkeletonLayout,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  SortUpDownIcon,
} from '@repo/ui';
import { HZLP_TOKEN_DECIMALS } from '@/common';
import FavoriteBtn from '@/common/components/FavoriteBtn';
import StatusMarker from '@/components/StatusMarker';
import type {
  PoolsListSortBy,
  PoolsListSortOrder,
} from '@/services/rest/pools';
import { usePoolFavoritesStore } from '@/stores/pools/favorites';
import { HZLP_NAME } from '@/stores/pools/trade';
import { type PoolsListItem } from '@/stores/synthetics/marketTokens/selectors';
import ActionBtn from './ActionBtn';
import MiniLineChart from './MiniLineChart';

export const FeeApyInfoContent = () => (
  <Trans>
    Annualized projection of fee income from trading activities only
    (open/close/borrow/liquidations), excluding price impact, PnL, and funding.
  </Trans>
);

export const FeeApyHeader = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="decoration-t-430 inline-flex items-center underline decoration-dotted underline-offset-3"
      >
        <Trans>Fee APY</Trans>
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="top"
      className="flex w-90 flex-col gap-2 rounded-2xl p-3 text-xs"
    >
      <FeeApyInfoContent />
    </TooltipContent>
  </Tooltip>
);

const PoolNameCell = ({ row }: { row: Row<PoolsListItem> }) => {
  const symbol = row.getValue<string | undefined>('symbol');
  const inst = row.original.inst;
  const displayName = row.original.displayName;
  const marketAddress = row.original.marketAddress;
  const isLoading = displayName === undefined;
  const iconSrc =
    IMAGES_MAP.instIcons[symbol as keyof typeof IMAGES_MAP.instIcons];
  const isFavorite = usePoolFavoritesStore((state) =>
    marketAddress ? state.isFavorite(marketAddress) : false,
  );
  const toggleFavorite = usePoolFavoritesStore((state) => state.toggleFavorite);

  return (
    <div className="flex items-center gap-2">
      {!isLoading && marketAddress ? (
        <FavoriteBtn
          className="size-[14px]"
          isFavorite={isFavorite}
          onToggle={() => toggleFavorite(marketAddress)}
        />
      ) : null}
      <SkeletonLayout isLoading={isLoading} className="size-6 rounded-full">
        {iconSrc ? (
          <Image
            src={iconSrc}
            alt={displayName ?? ''}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="bg-bg-5 flex size-6 items-center justify-center rounded-full text-xs">
            {displayName?.slice(0, 2)}
          </div>
        )}
      </SkeletonLayout>
      <SkeletonLayout isLoading={isLoading} className="h-[17px] w-16">
        <div className="flex items-center gap-1 text-sm font-medium">
          <span>{HZLP_NAME}: </span>
          <span className="mr-[1px]">{displayName}</span>
          <StatusMarker inst={inst} collisionPadding={{ left: 20 }} />
        </div>
      </SkeletonLayout>
    </div>
  );
};

type SortableHeaderProps = {
  label: ReactNode;
  sortBy: PoolsListSortBy;
  activeSortBy?: PoolsListSortBy;
  sortOrder?: PoolsListSortOrder;
  onSortChange?: (sortBy: PoolsListSortBy) => void;
};

const SortableHeader = ({
  label,
  sortBy,
  activeSortBy,
  sortOrder,
  onSortChange,
}: SortableHeaderProps) => {
  const isActive = activeSortBy === sortBy;
  const isAsc = sortOrder === 'asc';

  return (
    <div className="inline-flex items-center gap-1">
      {label}
      {onSortChange ? (
        <button
          type="button"
          aria-label={`Sort by ${sortBy}`}
          aria-pressed={isActive}
          className="group/self flex size-4 shrink-0 items-center justify-center"
          onClick={() => onSortChange(sortBy)}
        >
          <SortUpDownIcon
            upClassName={isActive && isAsc ? 'text-accent' : 'text-white/25'}
            downClassName={isActive && !isAsc ? 'text-accent' : 'text-white/35'}
          />
        </button>
      ) : null}
    </div>
  );
};

type CreateColumnsParams = {
  sortBy: PoolsListSortBy;
  sortOrder: PoolsListSortOrder;
  onSortChange: (sortBy: PoolsListSortBy) => void;
};

export const createColumns = (
  sortOptions?: CreateColumnsParams,
): ColumnDef<PoolsListItem>[] => [
  {
    accessorKey: 'marketAddress',
    enableHiding: true,
  },
  {
    accessorKey: 'symbol',
    header: () => <Trans>Pool</Trans>,
    filterFn: () => true,
    size: 1,
    meta: {
      headerClassName: 'min-w-[180px] w-[180px]',
      bodyClassName: 'min-w-[180px] w-[180px] truncate',
    },
    cell: ({ row }) => <PoolNameCell row={row} />,
  },
  {
    accessorKey: 'tvl',
    header: () => (
      <SortableHeader
        label={<Trans>TVL</Trans>}
        sortBy="tvl_usd"
        activeSortBy={sortOptions?.sortBy}
        sortOrder={sortOptions?.sortOrder}
        onSortChange={sortOptions?.onSortChange}
      />
    ),
    size: 1,
    meta: {
      headerClassName: 'min-w-[120px] w-[120px]',
      bodyClassName: 'min-w-[120px] w-[120px] truncate',
    },
    cell: ({ row }) => {
      const tvl = row.getValue<bigint | undefined>('tvl');
      if (tvl === undefined) {
        return <SkeletonLayout isLoading className="h-[14.4px] w-12" />;
      }
      const formattedTvl = unitFormat(
        calc(tvl.toString()).div(calc(10).pow(USD_DECIMALS)).toString(),
        2,
        {
          style: 'currency',
          currency: 'USD',
          showMinDecimalValue: true,
          stripTrailingZeros: true,
        },
      );
      return (
        <SkeletonLayout isLoading={false} className="h-[14.4px] w-12">
          <span className="font-medium">{formattedTvl}</span>
        </SkeletonLayout>
      );
    },
  },
  {
    accessorKey: 'supply',
    header: () => <Trans>Supply</Trans>,
    size: 1,
    meta: {
      headerClassName: 'min-w-[140px] w-[140px]',
      bodyClassName: 'min-w-[140px] w-[140px] truncate',
    },
    cell: ({ row }) => {
      const supply = row.getValue<bigint | undefined>('supply');
      if (supply === undefined) {
        return <SkeletonLayout isLoading className="h-[14.4px] w-16" />;
      }
      const formattedSupply = unitFormat(
        calc(supply.toString())
          .div(calc(10).pow(HZLP_TOKEN_DECIMALS))
          .toString(),
        2,
        {
          stripTrailingZeros: true,
        },
      );
      return (
        <SkeletonLayout isLoading={false} className="h-[14.4px] w-16">
          <span className="inline-block font-medium">{formattedSupply}</span>
          <span className="font-medium"> {HZLP_NAME}</span>
        </SkeletonLayout>
      );
    },
  },
  {
    accessorKey: 'feeApy',
    header: () => (
      <SortableHeader
        label={<FeeApyHeader />}
        sortBy="fee_apy"
        activeSortBy={sortOptions?.sortBy}
        sortOrder={sortOptions?.sortOrder}
        onSortChange={sortOptions?.onSortChange}
      />
    ),
    size: 1,
    meta: {
      headerClassName: 'min-w-[120px] w-[120px]',
      bodyClassName: 'min-w-[120px] w-[120px] truncate',
    },
    cell: ({ row }) => {
      const feeApy = row.getValue<string | undefined>('feeApy');
      const isLoading = feeApy === undefined;
      return (
        <SkeletonLayout isLoading={isLoading} className="h-[14.4px] w-12">
          <div className="font-plex">
            {feeApy !== undefined
              ? percentFormat(feeApy, 2, {
                  showMinDecimalValue: true,
                  stripTrailingZeros: true,
                })
              : '--'}
          </div>
        </SkeletonLayout>
      );
    },
  },
  {
    id: 'snapshot',
    header: () => <Trans>APR Snapshot</Trans>,
    size: 1,
    meta: {
      headerClassName: 'min-w-[140px] w-[140px]',
      bodyClassName: 'min-w-[140px] w-[140px] truncate',
    },
    cell: ({ row }) => {
      const feeAprHistory = row.original.aprHistory;
      const isLoading = feeAprHistory === undefined;
      const data =
        feeAprHistory?.map((item) => ({
          timestamp: item.timestamp,
          value: Number(item.fee_apr),
        })) ?? [];
      return (
        <SkeletonLayout isLoading={isLoading} className="h-8 w-30">
          <MiniLineChart data={data} className="max-w-30" />
        </SkeletonLayout>
      );
    },
  },
  {
    id: 'actions',
    header: () => <Trans>Actions</Trans>,
    size: 1,
    meta: {
      headerClassName: 'text-right min-w-[90px] w-[90px]',
      bodyClassName: 'text-right min-w-[90px] w-[90px]',
    },
    enableHiding: false,
    cell: ({ row }) => {
      const marketAddress = row.getValue<string | undefined>('marketAddress');
      return <ActionBtn marketAddress={marketAddress} />;
    },
  },
];

export const columns: ColumnDef<PoolsListItem>[] = createColumns();
