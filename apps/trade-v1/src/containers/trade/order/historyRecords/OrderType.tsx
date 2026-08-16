import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY_SHORT } from '@repo/lib/format';

interface OrderTypeProps {
  value: string;
}

const OrderType: FC<OrderTypeProps> = ({ value }) => {
  const { t } = useLingui();
  switch (value) {
    case 'limit':
      return t`Limit`;
    case 'market':
      return t`Market`;
    default:
      return value || EMPTY_DISPLAY_SHORT;
  }
};

export default OrderType;
