import { FC, useCallback } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Loading,
} from '@repo/ui';
import {
  usePositions,
  useCurrentAccountAddress,
  useInstStore,
  useMarketsConfigs,
} from '@/common';
import type { Position } from '@/common';

import { marketIsOpen } from '@/hooks/useMarketsStats';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { useOrdersStore } from '../../../store';
import { usePositionsStore } from '../../store';
import { useStableDialogValue } from '../hooks/useStableDialogValue';
import { useClosePositions } from './hooks/useCreateDecreaseOrder';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[86px]" />,
});

interface CloseAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const useCloseAll = (positions?: Position[]) => {
  const userAddress = useCurrentAccountAddress();
  const { refetch } = usePositions();
  const setClosingAll = usePositionsStore((state) => state.setClosingAll);

  const { mutateAsync: closePositions, isPending } =
    useClosePositions(positions);

  const handleCloseAll = useCallback(
    async (positions: Position[], options?: { onSuccess: () => void }) => {
      if (!userAddress) {
        return;
      }

      setClosingAll(true);
      try {
        await closePositions({
          positions,
          cb: () => {
            refetch();
            if (options?.onSuccess) {
              options.onSuccess();
            }
          },
        });
      } finally {
        setClosingAll(false);
      }
    },
    [userAddress, refetch, closePositions, setClosingAll],
  );

  return {
    handleCloseAll,
    isPending,
  };
};

const CloseAllDialog: FC<CloseAllDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useLingui();
  const { data: positions } = usePositions();
  const instId = useTradeGlobalStore((state) => state.instId);
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId];
  const onlyShowCurrentInst = useOrdersStore(
    (state) => state.onlyShowCurrentInst,
  );

  const { data: marketsConfigs } = useMarketsConfigs({
    markets: positions?.map((position) => insts[position.marketAddress]),
  });
  const filteredPositions = positions?.filter(
    (position) =>
      (!onlyShowCurrentInst ||
        position.marketAddress === inst?.marketTokenAddress) &&
      marketIsOpen(insts[position.marketAddress]) &&
      !marketsConfigs?.[position.marketAddress]?.isDisabled,
  );

  const { handleCloseAll, isPending } = useCloseAll(positions);
  const stableFilteredPositions = useStableDialogValue(filteredPositions, {
    open,
    resetKey: `${onlyShowCurrentInst}-${inst?.marketTokenAddress || ''}`,
  });

  if (!stableFilteredPositions?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px]">
        <DialogHeader>
          <DialogTitle>{t`Close All Position?`}</DialogTitle>
        </DialogHeader>
        <Content
          isPending={isPending}
          handleConfirm={() =>
            handleCloseAll(stableFilteredPositions, {
              onSuccess: () => {
                onOpenChange(false);
              },
            })
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default CloseAllDialog;
