import { FC, ReactNode } from 'react';

import { ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, Separator, TrendingDownIcon, TrendingUpIcon } from '@repo/ui';
import { useGlobalStore, useInstStore } from '@/common';

interface InstProps {
  targetCoin: string;
  isLong: boolean;
  lever?: string;
  orderType?: ReactNode;
  showSeparator?: boolean;
  children?: ReactNode;
}

const InstSm: FC<InstProps> = ({
  targetCoin,
  isLong,
  lever,
  orderType,
  showSeparator,
  children,
}) => {
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const insts = useInstStore((state) => state.getInsts());

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex size-5 items-center justify-center rounded-sm',
          isLong ? 'bg-up' : 'bg-down',
        )}
      >
        {isLong ? (
          <TrendingUpIcon size={16} className="text-accent-foreground" />
        ) : (
          <TrendingDownIcon size={16} className="text-accent-foreground" />
        )}
      </div>
      <div className="flex items-center justify-between gap-1.5 text-base font-medium">
        <span className="text-base">{insts[targetCoin]?.name || ''}</span>
        {lever && (
          <>
            {showSeparator && (
              <Separator orientation="vertical" className="!h-4" />
            )}
            <span className="text-t-270 font-plex">{`${truncateFormat(lever, leverDecimal, { stripTrailingZeros: true, round: ROUND_MODE.ROUND })}x`}</span>
          </>
        )}
        {orderType && (
          <>
            {showSeparator && (
              <Separator orientation="vertical" className="!h-4" />
            )}
            <span className="text-t-270">{orderType}</span>
          </>
        )}
        {children}
      </div>
    </div>
  );
};

export default InstSm;
