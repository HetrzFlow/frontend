'use client';

import { FC, ReactNode, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Alert, AlertDescription, cn } from '@repo/ui';
import { useMarketIsDisabled, useMarketIsPausing } from '@/common';

interface StatusProps {
  marketAddress: string;
  className?: string;
  text?: ReactNode;
}

const Status: FC<StatusProps> = ({ marketAddress, className, text }) => {
  const { t } = useLingui();
  const marketIsDisabled = useMarketIsDisabled(marketAddress);
  const marketIsPausing = useMarketIsPausing(marketAddress);
  const [open, setOpen] = useState(true);

  if (!marketIsDisabled && !marketIsPausing) {
    return null;
  }

  return (
    open && (
      <div className={cn('statusContainer shrink-0 max-md:px-0', className)}>
        <Alert
          open={open}
          onOpenChange={setOpen}
          className="!grid-cols-[1fr_calc(var(--spacing)*5)]"
          icon={<></>}
        >
          <AlertDescription className="col-start-1 text-xs">
            {text ??
              (marketIsDisabled
                ? t`This market has been temporarily disabled due to security considerations. Closing positions, withdrawing funds, opening, and increasing positions are all restricted.`
                : t`This market has been temporarily disabled due to security considerations. Closing positions and withdrawing funds remain available; opening or increasing positions is restricted.`)}
          </AlertDescription>
        </Alert>
      </div>
    )
  );
};
export default Status;
