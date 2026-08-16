import { FC } from 'react';

import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useGlobalStore } from '@/common';

interface PnLProps {
  pnl: string;
  isClose: boolean;
}

const PnL: FC<PnLProps> = ({ pnl, isClose }) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  return (
    <div
      className={cn(
        'font-plex max-md:text-sm',
        calc(pnl).lt(0) ? 'text-down' : '',
        calc(pnl).gt(0) ? 'text-up' : '',
      )}
    >
      {isClose
        ? truncateFormat(pnl, usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
            signDisplay: 'exceptZero',
          })
        : EMPTY_DISPLAY}
    </div>
  );
};

export default PnL;
