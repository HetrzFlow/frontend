import { FC } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Loading,
} from '@repo/ui';
import { usePositions, useInstStore } from '@/common';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[508px]" />,
});

interface CloseDialogProps {
  positionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CloseDialog: FC<CloseDialogProps> = ({
  positionId,
  open,
  onOpenChange,
}) => {
  const { t } = useLingui();
  const { data: positions } = usePositions();
  const position = positions?.find((v) => v.id === positionId);
  const { isLong, targetCoin = '' } = position || {};
  const coin = useInstStore((state) => state.getCoins()[targetCoin]);
  const coinName = coin?.symbol;

  if (!position) return null;

  const titleText = isLong
    ? t`Close Long ${coinName}`
    : t`Close Short ${coinName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="scrollbar-none max-h-screen w-[440px] overflow-y-auto"
        aria-describedby={undefined}
        overlayClassName="!pointer-events-none"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>
        <Content position={position} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

export default CloseDialog;
