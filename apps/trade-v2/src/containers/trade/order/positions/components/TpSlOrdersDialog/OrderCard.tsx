import { FC, useCallback, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { Button, LoaderCircleIcon } from '@repo/ui';
import { useInstStore, type Order } from '@/common';

import { EstPnlCell, EstReceiveCell, PriceCell, SizeCell } from './cells';
import { useTpSlProcessingStore, useTpSlTablePosition } from './context';

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

const OrderCard: FC<OrderCardProps> = ({ order, onEdit, onDelete }) => {
  const { t } = useLingui();
  const position = useTpSlTablePosition();
  const inst = useInstStore(
    (state) => state.getInsts()[position.marketAddress || ''],
  );

  const [isProcessingAll, isThisProcessing, isAnyProcessing, setProcessingItemId] =
    useTpSlProcessingStore(
      useShallow((state) => [
        state.isProcessingAll,
        state.processingItemId === order.id,
        state.processingItemId !== null,
        state.setProcessingItemId,
      ]),
    );

  const isProcessingRef = useRef(false);
  const onDeleteRef = useRef(onDelete);
  onDeleteRef.current = onDelete;

  const handleDelete = useCallback(async () => {
    if (isProcessingRef.current || isProcessingAll || isAnyProcessing) return;
    isProcessingRef.current = true;
    setProcessingItemId(order.id);
    try {
      await onDeleteRef.current(order);
    } finally {
      isProcessingRef.current = false;
      setProcessingItemId(null);
    }
  }, [order, isProcessingAll, isAnyProcessing, setProcessingItemId]);

  const isBusy = isThisProcessing || isProcessingRef.current;
  const isDisabled = isBusy || isProcessingAll || isAnyProcessing;

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-3">
      {/* Row 1: Size | Price */}
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-t-430 text-xs">{t`Size`}</span>
          <SizeCell order={order} displayUnit="" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-t-430 text-xs">{t`Price`}</span>
          <PriceCell order={order} pxDispDecimal={inst?.pxDispDecimal} />
        </div>
      </div>

      {/* Row 2: Est. PnL | Est. Receive */}
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-t-430 text-xs">{t`Est. PnL`}</span>
          <EstPnlCell order={order} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-t-430 text-xs">{t`Est. Receive`}</span>
          <EstReceiveCell order={order} />
        </div>
      </div>

      {/* Row 3: Edit | Cancel */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="xs"
          className="h-6 flex-1 rounded-lg"
          disabled={isDisabled}
          onClick={() => onEdit(order)}
        >
          {t`Edit`}
        </Button>
        <Button
          variant="secondary"
          size="xs"
          className="h-6 flex-1 rounded-lg"
          disabled={isDisabled}
          onClick={handleDelete}
        >
          {isBusy ? (
            <>
              <LoaderCircleIcon size={14} className="animate-spin" />
              {t`Cancelling`}
            </>
          ) : (
            t`Cancel`
          )}
        </Button>
      </div>
    </div>
  );
};

export default OrderCard;
