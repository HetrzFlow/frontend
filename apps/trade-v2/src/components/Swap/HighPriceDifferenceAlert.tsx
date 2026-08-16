'use client';

import { useLingui } from '@lingui/react/macro';

import { Alert, AlertDescription, AlertTitle } from '@repo/ui';

import { swapMessages, translateSwapMessage } from './messages';

const HighPriceDifferenceAlert = ({ difference }: { difference: string }) => {
  const { i18n, t } = useLingui();

  return (
    <Alert
      showClose={false}
      className="mt-2 items-start gap-x-1 p-2 text-xs has-[>svg]:grid-cols-[14px_1fr_0] [&>svg]:size-[14px]"
    >
      <AlertTitle className="min-h-0">{t`High price difference`}</AlertTitle>
      <AlertDescription className="gap-0 text-xs opacity-70">
        {translateSwapMessage(
          i18n,
          swapMessages.highPriceDifferenceDescription,
          { difference },
        )}
      </AlertDescription>
    </Alert>
  );
};

export default HighPriceDifferenceAlert;
