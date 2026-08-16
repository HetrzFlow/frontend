import { FC } from 'react';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { Inst } from '@/common';
import PointMarker from '@/common/components/PointMarker';
import { useMarketIsOpen } from '@/hooks/useMarketsStats';
import {
  getNextMarketTransition,
  isEffectively24x7,
} from '@/lib/market/dateConverter';
import Content from './Content';

interface StatusMarkerProps {
  className?: string;
  inst?: Inst;
  sideOffset?: number;
  collisionBoundary?: Element | null;
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
}

const StatusMarker: FC<StatusMarkerProps> = ({
  inst,
  sideOffset,
  collisionBoundary,
  collisionPadding,
  className,
}) => {
  const { data: marketIsOpen } = useMarketIsOpen(inst);

  if (
    !inst?.schedule ||
    inst.schedule === '24x7' ||
    isEffectively24x7(inst.schedule)
  ) {
    return null;
  }

  return (
    <div
      className={cn('flex items-center', className)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <Tooltip modal>
        <TooltipTrigger asChild>
          <div>
            <PointMarker status={marketIsOpen ? 'success' : 'failed'} />
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="w-90 bg-[color:var(--bg-6-solid)] p-3 max-md:w-[calc(100vw-var(--spacing)*8)]"
          arrowClassName="bg-[color:var(--bg-6-solid)] fill-[color:var(--bg-6-solid)]"
          side="bottom"
          sideOffset={sideOffset}
          collisionBoundary={collisionBoundary}
          collisionPadding={collisionPadding}
        >
          <Content
            marketIsOpen={marketIsOpen}
            tillTimestamp={(() => {
              const t = getNextMarketTransition(inst?.schedule);
              return marketIsOpen ? t.nextCloseTime : t.nextOpenTime;
            })()}
            schedule={inst.schedule}
          />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default StatusMarker;
