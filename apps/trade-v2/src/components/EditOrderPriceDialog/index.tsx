import { FC, useMemo } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { truncateFormat } from '@repo/lib/format';
import { Dialog, Loading } from '@repo/ui';
import { usePositions } from '@/common/services';
import type { Order } from '@/common/services';
import { useGlobalStore, useInstStore } from '@/common/stores';
import DialogShell from '@/components/DialogShell';
import { findPositionByMode } from '@/lib/trade/position';

interface EditPriceDialogProps {
  order?: Order;
  orderId?: string;
  initialValues?: {
    price?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean, modified?: boolean) => void;
  sizeEditable?: boolean;
  allOrders?: Order[];
}

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[263px]" />,
});

const EditOrderPriceDialog: FC<EditPriceDialogProps> = ({
  order,
  initialValues,
  open,
  onOpenChange,
  sizeEditable,
  allOrders,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const {
    isLong,
    isOpen,
    marketAddress = '',
    sizeDeltaUsd,
    isZFP,
  } = order || {};
  const { data: positions } = usePositions();
  const position =
    positions && order && isLong !== undefined
      ? findPositionByMode({
          positions,
          marketAddress,
          isLong,
          isZFP,
        })
      : undefined;

  const inst = useInstStore((state) => state.getInsts()[marketAddress]);
  const coinName = inst?.symbol.replace(/(\/USD$|^USD\/)/, '') || '';

  const [instText, dispSize] = useMemo(() => {
    let innerInstText = '';
    const innnerDispSize = truncateFormat(
      sizeDeltaUsd,
      usdAmountDisplayDecimal,
      {
        style: 'currency',
        currency: 'USD',
      },
    );

    if (sizeEditable) {
      innerInstText = isLong
        ? t`Close ${coinName} Long`
        : t`Close ${coinName} Short`;
      return [innerInstText, innnerDispSize];
    }

    if (isOpen && isLong) {
      innerInstText = position
        ? t`Increase ${coinName} Long`
        : t`Open ${coinName} Long`;
    }
    if (isOpen && !isLong) {
      innerInstText = position
        ? t`Increase ${coinName} Short`
        : t`Open ${coinName} Short`;
    }
    if (!isOpen) {
      innerInstText = isLong
        ? t`Decrease ${coinName} Long`
        : t`Decrease ${coinName} Short`;
    }

    return [innerInstText, innnerDispSize];
  }, [
    isOpen,
    isLong,
    position,
    t,
    coinName,
    sizeDeltaUsd,
    usdAmountDisplayDecimal,
    sizeEditable,
  ]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell
        dialogTitle={
          sizeEditable
            ? t`TP/SL Edit: ${instText}`
            : t`Edit ${instText} by ${dispSize}`
        }
        overlayClassName="!pointer-events-none"
        className="w-[440px]"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Content
          order={order}
          onOpenChange={onOpenChange}
          initialValues={initialValues}
          position={position}
          sizeEditable={sizeEditable}
          allOrders={allOrders}
        />
      </DialogShell>
    </Dialog>
  );
};

export default EditOrderPriceDialog;
