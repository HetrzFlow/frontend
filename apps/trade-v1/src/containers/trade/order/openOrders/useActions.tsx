import { Dispatch, SetStateAction, useCallback, useState } from 'react';

// handle edit order price action
export const useOnEditPrice = ({
  setCurOrderId,
}: {
  setCurOrderId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const onEditPrice = useCallback(
    (orderId: string) => {
      setCurOrderId(orderId);
      setDialogOpen(true);
    },
    [setCurOrderId],
  );

  return {
    dialogOpen,
    setDialogOpen,
    onEditPrice,
  };
};
