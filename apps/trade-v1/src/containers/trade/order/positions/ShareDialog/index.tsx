import { FC } from 'react';

import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Loading,
} from '@repo/ui';
import { usePositions, getCachedPriceTickerData, useInstStore } from '@/common';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[300px]" />,
});

interface OrdersDialogProps {
  positionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareDialog: FC<OrdersDialogProps> = ({
  positionId,
  open,
  onOpenChange,
}) => {
  const { data: positions } = usePositions();
  const position = positions?.find((v) => v.id === positionId);

  const {
    isLong = true,
    targetCoin = '',
    leverage = '',
    entryPrice = '',
  } = position || {};
  const inst = useInstStore((state) =>
    state.getInstsArr().find((v) => v.coinType === targetCoin),
  );

  const markPrice = getCachedPriceTickerData(inst?.id)?.[0]?.p || '';

  const coins = useInstStore((state) => state.getCoins());
  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[460px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="invisible">Share</DialogTitle>
        </DialogHeader>
        <Content
          isLong={isLong}
          instName={inst?.name || ''}
          instNameInImage={inst?.id.replace('/', '-') || ''}
          leverage={leverage}
          pxDispDecimal={coins[targetCoin]?.pxDispDecimal}
          entryPrice={entryPrice}
          markPrice={markPrice}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
