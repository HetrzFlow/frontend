import { forwardRef, memo } from 'react';

import { cn, ScrollBox } from '@repo/ui';
import TradeBox from './tradeBox';

const Trading = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, _) => {
    return (
      <ScrollBox
        className={cn('flex h-full flex-col')}
        scrollClassName={className}
      >
        <TradeBox />
      </ScrollBox>
    );
  },
);

Trading.displayName = 'Trading';

export default memo(Trading);
