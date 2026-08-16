import { FC } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Loading,
} from '@repo/ui';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading />,
});

interface OrdersDialogProps {
  positionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrdersDialog: FC<OrdersDialogProps> = ({
  positionId,
  open,
  onOpenChange,
}) => {
  const { t } = useLingui();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[680px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t`Trigger Orders`}</DialogTitle>
        </DialogHeader>
        <Content positionId={positionId} />
      </DialogContent>
    </Dialog>
  );
};

export default OrdersDialog;
