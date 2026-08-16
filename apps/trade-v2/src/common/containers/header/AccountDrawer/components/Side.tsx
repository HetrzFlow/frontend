import { FC, memo } from 'react';

import { useLingui } from '@lingui/react/macro';

import { EMPTY_DISPLAY } from '@repo/lib/format';

interface TypeProps {
  isBuy: boolean;
  isLong: boolean;
}

const Side: FC<TypeProps> = ({ isBuy, isLong }) => {
  const { t } = useLingui();

  if (isBuy && isLong) {
    return t`Open Long`;
  }

  if (!isBuy && isLong) {
    return t`Close Long`;
  }

  if (isBuy && !isLong) {
    return t`Close Short`;
  }

  if (!isBuy && !isLong) {
    return t`Open Short`;
  }

  return EMPTY_DISPLAY;
};

export default memo(Side);
