import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { Position } from '@/common/services';
import type { ORDER_TYPE } from '@/constants/enum';

const useDialogState = <T,>(initialSelection?: T) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<T | undefined>(initialSelection);

  const openDialog = useCallback((value?: T) => {
    setSelected(value);
    setDialogOpen(true);
  }, []);

  return {
    dialogOpen,
    setDialogOpen,
    selected,
    setSelected,
    openDialog,
  };
};

const usePositionIdDialog = ({
  setCurPositionId,
}: {
  setCurPositionId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const { dialogOpen, setDialogOpen, selected, setSelected, openDialog } =
    useDialogState<string>();

  useEffect(() => {
    setCurPositionId(selected);
  }, [selected, setCurPositionId]);

  const handleSetDialogOpen = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(undefined);
      }
    },
    [setDialogOpen, setSelected],
  );

  return {
    dialogOpen,
    setDialogOpen: handleSetDialogOpen,
    selectedPositionId: selected,
    openDialog,
  };
};

// handle close position action
export const useOnClose = ({
  setCurPositionId,
}: {
  setCurPositionId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const { dialogOpen, setDialogOpen, selected, setSelected, openDialog } =
    useDialogState<{
      positionId: string;
      defaultValues?: { orderType: ORDER_TYPE };
    }>();

  useEffect(() => {
    setCurPositionId(selected?.positionId);
  }, [selected, setCurPositionId]);

  const onClose = useCallback(
    (positionId: string, defaultValues?: { orderType: ORDER_TYPE }) => {
      openDialog({ positionId, defaultValues });
    },
    [openDialog],
  );

  const handleSetDialogOpen = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelected(undefined);
      }
    },
    [setDialogOpen, setSelected],
  );

  return {
    dialogOpen,
    setDialogOpen: handleSetDialogOpen,
    onClose,
    defaultValues: selected?.defaultValues,
  };
};

// handle close all positions dailog action
export const useOnCloseAll = () => {
  const { dialogOpen, setDialogOpen, openDialog } = useDialogState<void>();

  const onCloseAll = useCallback(() => {
    openDialog();
  }, [openDialog]);

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
  const { dialogOpen, setDialogOpen, openDialog } = usePositionIdDialog({
    setCurPositionId,
  });

  const onEditCollateral = useCallback(
    (positionId: string) => {
      openDialog(positionId);
    },
    [openDialog],
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
  const { dialogOpen, setDialogOpen, openDialog } = usePositionIdDialog({
    setCurPositionId,
  });

  const onShowOrders = useCallback(
    (positionId: string) => {
      openDialog(positionId);
    },
    [openDialog],
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
  const { dialogOpen, setDialogOpen, openDialog } = usePositionIdDialog({
    setCurPositionId,
  });

  const onOpenShareDialog = useCallback(
    (positionId: string) => {
      openDialog(positionId);
    },
    [openDialog],
  );

  return {
    dialogOpen,
    setDialogOpen,
    onOpenShareDialog,
  };
};

// handle open tp/sl orders dialog (Level-1 overview)
export const useOnOpenTpSlOrdersDialog = () => {
  const { dialogOpen, setDialogOpen, selected, openDialog } =
    useDialogState<Position | null>(null);

  const onOpenTpSlOrdersDialog = useCallback((position: Position) => {
    openDialog(position);
  }, [openDialog]);

  return {
    selectedPosition: selected ?? null,
    dialogOpen,
    setDialogOpen,
    onOpenTpSlOrdersDialog,
  };
};
