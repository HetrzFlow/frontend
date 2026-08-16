import { Dispatch, SetStateAction, useCallback, useState } from 'react';

// handle close position action
export const useOnClose = ({
  setCurPositionId,
}: {
  setCurPositionId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const onClose = useCallback(
    (positionId: string) => {
      setCurPositionId(positionId);
      setDialogOpen(true);
    },
    [setCurPositionId],
  );

  return {
    dialogOpen,
    setDialogOpen,
    onClose,
  };
};

// handle close all positions dailog action
export const useOnCloseAll = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const onCloseAll = useCallback(() => {
    setDialogOpen(true);
  }, []);

  return {
    dialogOpen,
    setDialogOpen,
    onCloseAll,
  };
};

// handle edit collateral action
export const useOnEditCollateral = ({
  setCurPositionId,
}: {
  setCurPositionId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const onEditCollateral = useCallback(
    (positionId: string) => {
      setCurPositionId(positionId);
      setDialogOpen(true);
    },
    [setCurPositionId],
  );

  return {
    dialogOpen,
    setDialogOpen,
    onEditCollateral,
  };
};

// handle open orders dailog action
export const useOnShowOrders = ({
  setCurPositionId,
}: {
  setCurPositionId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const onShowOrders = useCallback(
    (positionId: string) => {
      setCurPositionId(positionId);
      setDialogOpen(true);
    },
    [setCurPositionId],
  );

  return {
    dialogOpen,
    setDialogOpen,
    onShowOrders,
  };
};

// handle open share dialog
export const useOnOpenShareDialog = ({
  setCurPositionId,
}: {
  setCurPositionId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const onOpenShareDialog = useCallback(
    (positionId: string) => {
      setCurPositionId(positionId);
      setDialogOpen(true);
    },
    [setCurPositionId],
  );

  return {
    dialogOpen,
    setDialogOpen,
    onOpenShareDialog,
  };
};
