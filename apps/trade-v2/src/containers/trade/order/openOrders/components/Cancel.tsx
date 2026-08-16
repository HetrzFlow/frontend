import { FC, useRef, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { Button, LoaderCircleIcon } from '@repo/ui';
import { Order } from '@/common';
import MarketIsClosedTooltip from '@/components/MarketIsClosedTooltip';

import { useOpenOrdersStore } from '../store';

interface CancelProps {
  order: Order;
  onCancel: (orders: Order[]) => void;
}

const Cancel: FC<CancelProps> = ({ order, onCancel }) => {
  const { t } = useLingui();
  const [
    isProcessingAll,
    isStoreProcessing,
    isAnyProcessing,
    setProcessingItemId,
  ] = useOpenOrdersStore(
    useShallow((state) => [
      state.isProcessingAll,
      state.processingItemId === order.id,
      state.processingItemId !== null,
      state.setProcessingItemId,
    ]),
  );

  // Use ref to keep function reference stable
  const onCancelRef = useRef(onCancel);
  const orderRef = useRef(order);
  onCancelRef.current = onCancel;
  orderRef.current = order;

  // Local ref to track if this specific item is processing
  const isProcessingRef = useRef(false);

  const handleCancel = useCallback(async () => {
    // Prevent duplicate clicks using local ref
    if (isProcessingRef.current || isProcessingAll || isAnyProcessing) return;

    isProcessingRef.current = true;
    setProcessingItemId(orderRef.current.id);

    try {
      await onCancelRef.current([orderRef.current]);
    } finally {
      isProcessingRef.current = false;
      setProcessingItemId(null);
    }
  }, [isProcessingAll, isAnyProcessing, setProcessingItemId]);

  const isThisItemProcessing = isStoreProcessing || isProcessingRef.current;
  const isDisabled = isThisItemProcessing || isProcessingAll || isAnyProcessing;

  return (
    <MarketIsClosedTooltip marketAddress={order.marketAddress}>
      <Button
        size="sm"
        variant="accent"
        className="h-6"
        disabled={isDisabled}
        onClick={(e) => {
          e.stopPropagation();
          handleCancel();
        }}
      >
        {isThisItemProcessing ? (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {t`Cancelling`}
          </>
        ) : (
          t`Cancel`
        )}
      </Button>
    </MarketIsClosedTooltip>
  );
};

export default Cancel;
