import { useRef, useCallback, FC, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { Button, LoaderCircleIcon } from '@repo/ui';
import { Order, useInstStore } from '@/common';
import { marketIsOpen } from '@/hooks/useMarketsStats';

import { useOpenOrdersStore } from '../store';

interface CancelAllProps {
  orders: Order[];
  onCancel: (orders: Order[]) => void;
}

const CancelAll: FC<CancelAllProps> = ({ orders, onCancel }) => {
  const { t } = useLingui();
  const insts = useInstStore((state) => state.getInsts());
  const [processingItemId, isProcessingAll, setProcessingAll] =
    useOpenOrdersStore(
      useShallow((state) => [
        state.processingItemId,
        state.isProcessingAll,
        state.setProcessingAll,
      ]),
    );

  const filterOrders = useMemo(
    () =>
      orders.filter((order) => marketIsOpen(insts[order.marketAddress])),
    [insts, orders],
  );
  const orderCount = filterOrders.length;
  const isDisabled = !orderCount || isProcessingAll || !!processingItemId;

  // Use ref to keep function reference stable
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const handleCancelAll = useCallback(async () => {
    if (isProcessingAll) return;
    setProcessingAll(true);
    try {
      await onCancelRef.current(filterOrders);
    } finally {
      setProcessingAll(false);
    }
  }, [isProcessingAll, setProcessingAll, filterOrders]);

  return (
    <Button
      size="xs"
      variant="accentLight"
      disabled={isDisabled}
      onClick={handleCancelAll}
    >
      {isProcessingAll ? (
        <>
          <LoaderCircleIcon size={14} className="animate-spin" />
          {t`Cancelling`}
        </>
      ) : orderCount ? (
        t`Cancel all (${orderCount})`
      ) : (
        t`Cancel all`
      )}
    </Button>
  );
};

export default CancelAll;
