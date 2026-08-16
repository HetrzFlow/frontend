import { ReactNode } from 'react';
import { Trans } from '@lingui/react/macro';
import { SkeletonLayout } from '@repo/ui';
import ModuleCard from '@/components/ModuleCard';

const ACTIVITY_TABLE_SKELETON_ROWS = 4;
const ACTIVITY_CARD_SKELETON_ROWS = 5;

const ActivityTabsSkeleton = ({
  activityLabel,
}: {
  activityLabel: ReactNode;
}) => (
  <div className="w-full">
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground scrollbar-none relative inline-flex w-fit flex-nowrap items-center justify-start gap-1 overflow-x-auto rounded-lg bg-transparent text-sm font-medium">
        <button
          type="button"
          className="focus-visible:ring-ring/50 focus-visible:outline-ring data-[state=active]:text-accent-foreground text-t-270 hover:text-t-1100 z-2 inline-flex h-auto flex-none grow-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:transition-[color,box-shadow] focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0"
        >
          <Trans>Your Activity</Trans>
        </button>
        <button
          type="button"
          className="focus-visible:ring-ring/50 focus-visible:outline-ring data-[state=active]:text-accent-foreground text-t-1100 hover:text-t-1100 z-2 inline-flex h-auto flex-none grow-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:transition-[color,box-shadow] focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0"
        >
          {activityLabel}
        </button>
        <div className="bg-bg-3 pointer-events-none absolute top-0 right-0 bottom-0 z-1 h-full rounded-lg">
          <button
            type="button"
            tabIndex={-1}
            className="invisible inline-flex h-auto flex-none grow-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
          >
            {activityLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ActivityCardRowsSkeleton = () => (
  <div className="flex flex-col gap-2">
    {Array.from({
      length: ACTIVITY_CARD_SKELETON_ROWS,
    }).map((_, index) => (
      <div
        key={`activity-card-skeleton-${index}`}
        className="flex items-center justify-between gap-3 px-0 py-2"
      >
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
    ))}
  </div>
);

const ActivityTableRowsSkeleton = () => (
  <div className="flex min-h-0 flex-col gap-2">
    <div className="text-t-350 grid grid-cols-4 gap-4 px-2 py-1 text-xs">
      <span>
        <Trans>Action</Trans>
      </span>
      <span>
        <Trans>Value</Trans>
      </span>
      <span>
        <Trans>User</Trans>
      </span>
      <span className="text-right">
        <Trans>Time / Hash</Trans>
      </span>
    </div>
    {Array.from({
      length: ACTIVITY_TABLE_SKELETON_ROWS,
    }).map((_, index) => (
      <div
        key={`activity-table-skeleton-${index}`}
        className="grid grid-cols-4 gap-4 rounded-xl p-2"
      >
        <div className="bg-bg-3 h-[14.4px] w-20 rounded-xl" />
        <div className="bg-bg-3 h-[14.4px] w-16 rounded-xl" />
        <div className="bg-bg-3 h-[14.4px] w-20 rounded-xl" />
        <div className="bg-bg-3 ml-auto h-[14.4px] w-24 rounded-xl" />
      </div>
    ))}
  </div>
);

const ActivityPanelSkeleton = ({
  type,
  fitContentHeight = false,
  disableMaxHeight = false,
  layout = 'table',
  className,
  disableMobileCard = false,
}: {
  type: 'pool' | 'vault';
  fitContentHeight?: boolean;
  disableMaxHeight?: boolean;
  layout?: 'table' | 'card';
  className?: string;
  disableMobileCard?: boolean;
}) => {
  const baseCardClassName = [
    fitContentHeight
      ? 'min-h-0 flex flex-col overflow-hidden p-3'
      : 'h-full min-h-0 flex flex-col overflow-hidden p-3',
    disableMaxHeight ? '' : 'max-h-108',
  ]
    .filter(Boolean)
    .join(' ');
  const skeletonCardClassName = [baseCardClassName, className]
    .filter(Boolean)
    .join(' ');
  const contentWrapClassName =
    layout === 'card'
      ? 'min-h-0 flex-1 flex flex-col relative z-0'
      : 'min-h-0 flex-1 flex flex-col overflow-hidden relative z-0';
  const listWrapperClassName = 'max-h-60 overflow-y-auto';
  const activityLabel =
    type === 'pool' ? (
      <Trans>Pool Activity</Trans>
    ) : (
      <Trans>Vault Activity</Trans>
    );

  return (
    <ModuleCard
      className={[
        skeletonCardClassName,
        disableMobileCard ? 'max-md:contents' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-full min-h-0 flex-col gap-3">
          <ActivityTabsSkeleton activityLabel={activityLabel} />
          <div className={contentWrapClassName}>
            <div className="flex min-h-0 flex-col">
              <div className={listWrapperClassName}>
                {layout === 'card' ? (
                  <ActivityCardRowsSkeleton />
                ) : (
                  <>
                    <div className="hidden md:block">
                      <ActivityTableRowsSkeleton />
                    </div>
                    <div className="block md:hidden">
                      <ActivityCardRowsSkeleton />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
};

export default ActivityPanelSkeleton;
