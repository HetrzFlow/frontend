import { FC, useMemo } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { truncateFormat } from '@repo/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Loading,
} from '@repo/ui';
import { useGlobalStore, useOpenOrders, useInstStore } from '@/common';

interface EditPriceDialogProps {
  orderId?: string;
  initialValues?: {
    price?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean, modified?: boolean) => void;
}

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[263px]" />,
});

const EditOrderPriceDialog: FC<EditPriceDialogProps> = ({
  orderId,
  initialValues,
  open,
  onOpenChange,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const { data: orders } = useOpenOrders();
  const order = orders?.find((v) => v.orderId === orderId);
  const {
    isLong,
    targetCoin = '',
    isOpen,
    position: positionId,
    size,
  } = order || {};
  const inst = useInstStore((state) =>
    state.getInstsArr().find((v) => v.coinType === targetCoin),
  );
  const coinName = inst?.id.split('/')[0] || '';

  const [instText, dispSize] = useMemo(() => {
    let innerInstText = '';
    const innnerDispSize = truncateFormat(size, usdAmountDisplayDecimal, {
      style: 'currency',
      currency: 'USD',
    });
    if (isOpen && isLong) {
      innerInstText = positionId
        ? t`Increase ${coinName} Long`
        : t`Open ${coinName} Long`;
    }
    if (isOpen && !isLong) {
      innerInstText = positionId
        ? t`Increase ${coinName} Short`
        : t`Open ${coinName} Short`;
    }
    if (!isOpen) {
      innerInstText = isLong
        ? t`Decrease ${coinName} Long`
        : t`Decrease ${coinName} Short`;
    }

    return [innerInstText, innnerDispSize];
  }, [isOpen, isLong, positionId, t, coinName, size, usdAmountDisplayDecimal]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="!pointer-events-none"
        className="w-[440px]"
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t`Edit ${instText} by ${dispSize}`}</DialogTitle>
        </DialogHeader>
        <Content
          order={order}
          onOpenChange={onOpenChange}
          initialValues={initialValues}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderPriceDialog;
