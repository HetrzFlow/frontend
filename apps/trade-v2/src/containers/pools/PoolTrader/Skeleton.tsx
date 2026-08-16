import { Trans } from '@lingui/react/macro';
import ModuleCard from '@/components/ModuleCard';

const PoolTraderSkeleton = ({
  variant = 'desktop',
  className,
  showHoldings,
}: {
  variant?: 'desktop' | 'dialog';
  className?: string;
  showHoldings?: boolean;
}) => {
  const containerClassName =
    variant === 'desktop'
      ? 'hidden min-h-0 w-90 shrink-0 flex-col gap-2 md:flex'
      : 'flex w-full min-h-0 flex-col gap-2';
  const shouldShowHoldings = showHoldings ?? variant === 'desktop';

  return (
    <div className={[containerClassName, className].filter(Boolean).join(' ')}>
      {shouldShowHoldings ? (
        <div className="bg-bg-2 shrink-0 rounded-2xl p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-t-270 text-xs">
                <Trans>Deposited</Trans>
              </div>
              <div className="bg-bg-3 h-[19.2px] w-28 rounded-xl text-base"></div>
            </div>
            <div className="relative h-[11px]">
              <div className="bg-bg-4 absolute inset-x-0 top-0.5 h-1.5 overflow-hidden rounded-full"></div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="bg-bg-3 h-3.5 w-10 rounded-xl" />
              <div className="bg-bg-3 h-3.5 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ) : null}
      <ModuleCard className="relative flex flex-col">
        <div className="bg-bg-3 h-[500px] w-full rounded-xl" />
      </ModuleCard>
    </div>
  );
};

export default PoolTraderSkeleton;
