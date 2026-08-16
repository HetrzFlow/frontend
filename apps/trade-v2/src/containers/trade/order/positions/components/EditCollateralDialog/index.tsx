import { FC } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';

import { Dialog, Loading } from '@repo/ui';
import { type Position, useInstStore } from '@/common';
import { getShortInstName } from '@/common/utils/inst';
import DialogShell from '@/components/DialogShell';
import { useStableDialogValue } from '../hooks/useStableDialogValue';

interface EditCollateralDialogProps {
  positionId?: string;
  position?: Position;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[464px]" />,
});

const EditCollateralDialog: FC<EditCollateralDialogProps> = ({
  positionId,
  position: livePosition,
  open,
  onOpenChange,
}) => {
  const { t } = useLingui();
  const position = useStableDialogValue(livePosition, {
    open,
    resetKey: positionId,
  });
  const { isLong, marketAddress = '' } = position || {};
  const inst = useInstStore((state) => state.getInsts()[marketAddress]);

  if (!position) return null;

  const shortInstName = getShortInstName(inst);
  const instText = isLong
    ? t`Long ${shortInstName}`
    : t`Short ${shortInstName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell
        dialogTitle={t`Edit Collateral (${instText})`}
        overlayClassName="!pointer-events-none"
        className="editCollateralDialog w-[440px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <Content position={position} onOpenChange={onOpenChange} />
      </DialogShell>
    </Dialog>
  );
};

export default EditCollateralDialog;
