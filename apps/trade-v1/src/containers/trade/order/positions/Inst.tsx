import { FC } from 'react';

import { ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useGlobalStore, useInstStore } from '@/common';

interface InstProps {
  targetCoin: string;
  isLong: boolean;
  lever?: string;
}

const Inst: FC<InstProps> = ({ targetCoin, isLong, lever }) => {
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const insts = useInstStore((state) => state.getInsts());

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex h-8 w-[3px] items-center justify-center rounded-full',
          isLong ? 'bg-up' : 'bg-down',
        )}
      ></div>
      <div className="flex flex-col items-start justify-between gap-0.5 font-medium">
        <span>{insts[targetCoin]?.name || ''}</span>
        <span className="text-t-270 font-plex">{`${truncateFormat(lever, leverDecimal, { stripTrailingZeros: true, round: ROUND_MODE.ROUND })}x`}</span>
      </div>
    </div>
  );
};

export default Inst;
