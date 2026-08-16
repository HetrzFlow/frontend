import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';

// handle edit order price action
export const useOnEditOrderPrice = ({
  setCurOrderId,
}: {
  setCurOrderId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const onDialogClose =
    useRef<(modified?: boolean) => void | undefined>(undefined);
  const [initialValues, setInitialValues] = useState<
    { price?: string } | undefined
  >();

  const onEditOrderPrice = useCallback(
    (
      orderId: string,
      options?: {
        initialValues?: {
          price?: string;
        };
        callback?: (modified?: boolean) => void;
      },
    ) => {
      setCurOrderId(orderId);
      setDialogOpen(true);
      setInitialValues(options?.initialValues);
      onDialogClose.current = options?.callback;
    },
    [setCurOrderId],
  );

  const onDialogOpen = useCallback((open: boolean, modified?: boolean) => {
    setDialogOpen(open);
    if (!open) {
      onDialogClose.current?.(modified);
    }
  }, []);

  return {
    dialogOpen,
    initialValues,
    setDialogOpen: onDialogOpen,
    onEditOrderPrice,
  };
};
