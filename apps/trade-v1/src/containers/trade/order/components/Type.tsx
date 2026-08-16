import { FC, memo } from 'react';

import { useLingui } from '@lingui/react/macro';

import { EMPTY_DISPLAY } from '@repo/lib/format';
import { ORDER_TYPE } from '@/constants/enum';

interface TypeProps {
  type: ORDER_TYPE;
}

const Type: FC<TypeProps> = ({ type }) => {
  const { t } = useLingui();
  let displayType = EMPTY_DISPLAY;

  switch (type) {
    case ORDER_TYPE.limit:
      displayType = t`Limit`;
      break;
    case ORDER_TYPE.trigger:
      displayType = t`Trigger`;
      break;
    case ORDER_TYPE.market:
      displayType = t`Market`;
      break;
  }

  return <div className="min-w-12">{displayType}</div>;
};

export default memo(Type);
