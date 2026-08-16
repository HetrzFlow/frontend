import { Trans, useLingui } from '@lingui/react/macro';
import {
  Skeleton,
  SkeletonLayout,
  Table as BasicTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { getCategoryLabelMessage } from '@/lib/market/categoryLabels';
import { CATEGORY } from '@/services/rest/pools';
import MobilePoolCardSkeleton from '../MobilePoolCardSkeleton';
import { poolsListSkeletonRows } from './skeletonRows';

const MOBILE_POOL_CARD_SKELETON_IDS = poolsListSkeletonRows.map(
  (_, index) => `pool-card-skeleton-${index}`,
);

const categoryLabels = [
  CATEGORY.all,
  CATEGORY.favorites,
  CATEGORY.forex,
  CATEGORY.equities,
  CATEGORY.indices,
  CATEGORY.crypto,
  CATEGORY.commodities,
  CATEGORY.memes,
];

const desktopTableColumns = [
  {
    key: 'pool',
    label: <Trans>Pool</Trans>,
    headerClassName: 'min-w-[180px] w-[180px]',
    bodyClassName: 'min-w-[180px] w-[180px]',
    cell: (
      <div className="flex items-center gap-2">
        <SkeletonLayout isLoading className="size-6 rounded-full" />
        <SkeletonLayout isLoading className="h-[17px] w-16" />
      </div>
    ),
  },
  {
    key: 'tvl',
    label: <Trans>TVL</Trans>,
    headerClassName: 'min-w-[120px] w-[120px]',
    bodyClassName: 'min-w-[120px] w-[120px]',
    cell: <SkeletonLayout isLoading className="h-[14.4px] w-12" />,
  },
  {
    key: 'supply',
    label: <Trans>Supply</Trans>,
    headerClassName: 'min-w-[140px] w-[140px]',
    bodyClassName: 'min-w-[140px] w-[140px]',
    cell: <SkeletonLayout isLoading className="h-[14.4px] w-16" />,
  },
  {
    key: 'fee-apy',
    label: <Trans>Fee APY</Trans>,
    headerClassName: 'min-w-[120px] w-[120px]',
    bodyClassName: 'min-w-[120px] w-[120px]',
    cell: <SkeletonLayout isLoading className="h-[14.4px] w-12" />,
  },
  {
    key: 'apr-snapshot',
    label: <Trans>APR Snapshot</Trans>,
    headerClassName: 'min-w-[140px] w-[140px]',
    bodyClassName: 'min-w-[140px] w-[140px]',
    cell: <SkeletonLayout isLoading className="h-8 w-30" />,
  },
  {
    key: 'actions',
    label: <Trans>Actions</Trans>,
    headerClassName: 'min-w-[90px] w-[90px] text-right',
    bodyClassName: 'min-w-[90px] w-[90px] text-right',
    cell: (
      <SkeletonLayout
        isLoading
        className="ml-auto h-[24.4px] w-16 rounded-xl"
      />
    ),
  },
];

const DesktopPoolsControlsSkeleton = () => {
  const { i18n } = useLingui();

  return (
    <div className="flex shrink-0 items-center gap-6">
      <div className="w-0.55 min-w-0 overflow-hidden">
        <div className="z-2 flex justify-start gap-1 font-medium">
          {categoryLabels.map((category, index) => (
            <div
              key={category}
              className={`grow-0 rounded-xl px-4 py-[9px] text-xs whitespace-nowrap ${
                index === 0 ? 'bg-bg-4 text-t-1100' : 'text-t-270'
              }`}
            >
              {i18n._(getCategoryLabelMessage(category))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-8 min-w-0 flex-1 rounded-xl" />
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-t-350 text-xs whitespace-nowrap">
            <Trans>In Wallet</Trans>
          </div>
          <Skeleton className="h-4 w-7.5 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const DesktopPoolsTableSkeleton = () => (
  <div className="relative min-h-0 flex-1 overflow-hidden pb-0">
    <BasicTable
      wrapClassName="scrollbar-none h-full overflow-y-auto"
      className="border-separate border-spacing-x-0 border-spacing-y-1 -translate-y-1"
    >
      <TableHeader className="bg-bg-card-mix sticky top-1 z-50">
        <TableRow className="text-center">
          {desktopTableColumns.map((column) => (
            <TableHead
              key={column.key}
              className={`bg-bg-card-mix first:bg-bg-card-mix last:bg-bg-card-mix first:sticky first:left-0 first:z-20 first:pl-2 last:sticky last:right-0 last:z-20 last:pr-2 ${column.headerClassName}`}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {poolsListSkeletonRows.map((_, rowIndex) => (
          <TableRow
            key={`desktop-pool-table-skeleton-${rowIndex}`}
            className="group"
          >
            {desktopTableColumns.map((column) => (
              <TableCell
                key={column.key}
                className={`bg-bg-card-mix py-1 first:sticky first:left-0 first:z-10 first:pl-2 last:sticky last:right-0 last:z-10 last:pr-2 ${column.bodyClassName}`}
              >
                <div className="flex h-[36px] items-center">{column.cell}</div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </BasicTable>
  </div>
);

export const MobilePoolsControlsSkeleton = () => (
  <>
    <Skeleton className="h-[37px] w-full rounded-xl" />
    <div className="flex flex-1 items-center gap-2">
      <Skeleton className="h-8 min-w-4 flex-1 rounded-xl" />
      <div className="flex items-center gap-2">
        <div className="text-t-350 text-xs">
          <Trans>In Wallet</Trans>
        </div>
        <Skeleton className="h-4 w-7.5 rounded-full" />
      </div>
    </div>
  </>
);

const PoolsListSkeleton = () => (
  <>
    <div className="hidden h-full min-w-0 flex-col gap-3 md:flex">
      <DesktopPoolsControlsSkeleton />
      <DesktopPoolsTableSkeleton />
    </div>

    <div className="block px-4 pb-16 md:hidden">
      <div className="space-y-3">
        <MobilePoolsControlsSkeleton />
        <div className="space-y-[10px] py-4">
          {MOBILE_POOL_CARD_SKELETON_IDS.map((id) => (
            <MobilePoolCardSkeleton key={id} />
          ))}
        </div>
      </div>
    </div>
  </>
);

export default PoolsListSkeleton;
