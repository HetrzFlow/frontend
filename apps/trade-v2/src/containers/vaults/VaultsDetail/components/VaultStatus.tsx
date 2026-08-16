'use client';

import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Alert, AlertDescription, cn } from '@repo/ui';

const VaultStatus = ({
  isDisabled,
  className,
}: {
  isDisabled?: boolean;
  className?: string;
}) => {
  const { t } = useLingui();
  const [open, setOpen] = useState(true);

  if (!isDisabled) {
    return null;
  }

  return (
    open && (
      <div
        className={cn(
          'statusContainer shrink-0 px-0 mt-2 max-md:px-0',
          className,
        )}
      >
        <Alert
          open={open}
          onOpenChange={setOpen}
          className="!grid-cols-[1fr_calc(var(--spacing)*5)]"
          icon={<></>}
        >
          <AlertDescription className="col-start-1 text-xs">
            {t`This vault has been temporarily disabled due to security considerations. Withdrawals remain available; deposits are restricted.`}
          </AlertDescription>
        </Alert>
      </div>
    )
  );
};

export default VaultStatus;
