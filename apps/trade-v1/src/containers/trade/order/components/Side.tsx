import { FC, memo } from 'react';

import { useLingui } from '@lingui/react/macro';

import { EMPTY_DISPLAY } from '@repo/lib/format';
import { cn } from '@repo/ui';

interface TypeProps {
  isBuy?: boolean;
  isLong: boolean;
}

const Side: FC<TypeProps> = ({ isBuy, isLong }) => {
  const { t } = useLingui();

  let displaySide = EMPTY_DISPLAY;

  if (isBuy !== undefined) {
    if (isBuy && isLong) {
      displaySide = t`Open Long`;
    }

    if (!isBuy && isLong) {
      displaySide = t`Close Long`;
    }

    if (isBuy && !isLong) {
      displaySide = t`Close Short`;
    }

    if (!isBuy && !isLong) {
      displaySide = t`Open Short`;
    }
  }

  return (
    <div
      className={cn(
        'min-w-20',
        isBuy === undefined ? '' : isBuy ? 'text-up' : 'text-down',
      )}
    >
      {displaySide}
    </div>
  );
};

export default memo(Side);
