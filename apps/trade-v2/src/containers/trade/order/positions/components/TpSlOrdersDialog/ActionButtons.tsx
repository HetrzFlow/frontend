import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Button } from '@repo/ui';
import { type Order } from '@/common/services';

import CancelAllButton from './CancelAllButton';

interface ActionButtonsProps {
  isSm: boolean;
  orders: Order[];
  onAddTpSl: () => void;
  onCancel: (orders: Order[]) => Promise<void>;
}

const ActionButtons: FC<ActionButtonsProps> = ({
  isSm,
  orders,
  onAddTpSl,
  onCancel,
}) => {
  const { t } = useLingui();

  return (
    <div className="flex items-center gap-2 max-md:mt-2 max-md:flex-col">
      <Button
        size={isSm ? undefined : 'xs'}
        variant="accent"
        className="max-md:w-full md:text-xs"
        onClick={onAddTpSl}
      >
        {t`Add TP/SL`}
      </Button>
      <CancelAllButton
        size={isSm ? undefined : 'xs'}
        variant="accentLight"
        className="max-md:w-full md:text-xs"
        orders={orders}
        onCancel={onCancel}
      />
    </div>
  );
};

export default ActionButtons;
