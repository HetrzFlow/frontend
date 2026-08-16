import { Trans } from '@lingui/react/macro';
import ModuleCard from '@/components/ModuleCard';

const DETAIL_INFO_TAB_LABELS = [
  { key: 'tvl', label: <Trans>TVL</Trans> },
  { key: 'fee-apr', label: <Trans>Fee APR</Trans> },
] as const;
const ACTIVE_DETAIL_INFO_TAB_LABEL = DETAIL_INFO_TAB_LABELS[0];

const DetailInfoTabsListSkeleton = () => (
  <div className="w-full">
    <div className="scrollbar-none relative flex w-full min-w-0 items-center overflow-x-auto">
      <div className="relative inline-flex w-fit flex-nowrap items-center justify-start gap-1 overflow-x-auto rounded-lg bg-transparent text-sm font-medium">
        {DETAIL_INFO_TAB_LABELS.map(({ key, label }, index) => (
          <div
            key={key}
            className={[
              'text-t-270 z-2 inline-flex h-auto flex-none grow-0 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap',
              index === 0 ? 'text-t-1100' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </div>
        ))}
        <div className="bg-bg-3 pointer-events-none absolute top-0 left-0 z-1 h-full rounded-lg px-3 py-1.5">
          <span className="invisible text-xs font-medium whitespace-nowrap">
            {ACTIVE_DETAIL_INFO_TAB_LABEL.label}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const DetailInfoTabsContentSkeleton = () => (
  <div className="space-y-2">
    <div className="bg-bg-3 h-[28.8px] w-24 rounded-xl" />
    <div className="bg-bg-3 h-[159px] w-full rounded-xl max-md:rounded-2xl" />
  </div>
);

const DetailInfoTabsSkeleton = ({
  variant,
  constrained = false,
}: {
  variant: 'pool' | 'vault';
  constrained?: boolean;
}) => {
  const cardClassName =
    variant === 'vault'
      ? 'relative flex min-h-[264px] flex-1 flex-col overflow-hidden p-3'
      : constrained
        ? 'relative p-3 min-h-0 flex flex-col overflow-hidden'
        : 'relative min-h-[264px] overflow-hidden p-3';
  const desktopClassName =
    variant === 'vault' ? 'hidden min-w-0 flex-1 md:block' : 'hidden md:block';
  const desktopInnerClassName =
    variant === 'vault' ? 'flex flex-col gap-2 space-y-3' : 'space-y-4';
  const mobileContentClassName = variant === 'vault' ? 'mt-3' : 'mt-2';

  return (
    <>
      <div className={desktopClassName}>
        <ModuleCard className={cardClassName}>
          <div className={desktopInnerClassName}>
            <DetailInfoTabsListSkeleton />
            <DetailInfoTabsContentSkeleton />
          </div>
        </ModuleCard>
      </div>
      <div className="block md:hidden">
        <DetailInfoTabsListSkeleton />
        <div className={mobileContentClassName}>
          <DetailInfoTabsContentSkeleton />
        </div>
      </div>
    </>
  );
};

export default DetailInfoTabsSkeleton;
