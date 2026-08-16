import { FC, useCallback, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Button, LoaderCircleIcon } from '@repo/ui';
import { type Order } from '@/common/services';

import { useTpSlProcessingStore } from './context';

type ButtonComponentProps = React.ComponentProps<typeof Button>;

interface CancelAllButtonProps extends Pick<ButtonComponentProps, 'variant' | 'className'>, Partial<Pick<ButtonComponentProps, 'size'>> {
  orders: Order[];
  onCancel: (orders: Order[]) => Promise<void>;
}

const CancelAllButton: FC<CancelAllButtonProps> = ({
  orders,
  onCancel,
  ...buttonProps
}) => {
  const { t } = useLingui();
  const { processingItemId, isProcessingAll, setProcessingAll } =
    useTpSlProcessingStore();

  const isDisabled = orders.length === 0 || isProcessingAll || !!processingItemId;

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const handleCancelAll = useCallback(async () => {
    if (isProcessingAll || orders.length === 0) return;
    setProcessingAll(true);
    try {
      await onCancelRef.current(orders);
    } finally {
      setProcessingAll(false);
    }
  }, [isProcessingAll, setProcessingAll, orders]);

  return (
    <Button
      disabled={isDisabled}
      onClick={handleCancelAll}
      {...buttonProps}
    >
      {isProcessingAll ? (
        <>
          <LoaderCircleIcon size={14} className="animate-spin" />
          {t`Cancelling`}
        </>
      ) : (
        t`Cancel All`
      )}
    </Button>
  );
};

export default CancelAllButton;
