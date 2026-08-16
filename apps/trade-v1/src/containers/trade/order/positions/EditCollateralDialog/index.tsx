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

interface EditCollateralDialogProps {
  positionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[464px]" />,
});

const EditCollateralDialog: FC<EditCollateralDialogProps> = ({
  positionId,
  open,
  onOpenChange,
}) => {
  const { t } = useLingui();
  const { data: positions } = usePositions();
  const position = positions?.find((v) => v.id === positionId);
  const { isLong, targetCoin = '' } = position || {};
  const inst = useInstStore((state) =>
    state.getInstsArr().find((v) => v.coinType === targetCoin),
  );
  const coinName = inst?.id.split('/')[0] || '';

  if (!position) return null;

  const instText = isLong ? t`Long ${coinName}` : t`Short ${coinName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="!pointer-events-none"
        className="w-[440px]"
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t`Edit Collateral (${instText})`}</DialogTitle>
        </DialogHeader>
        <Content position={position} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

export default EditCollateralDialog;
