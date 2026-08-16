import { FC } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { Dialog, Loading } from '@repo/ui';
import { useInstStore, type Position } from '@/common';
import { getShortInstName } from '@/common/utils/inst';
import DialogShell from '@/components/DialogShell';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[400px]" />,
});

interface TpSlOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position | null;
}

const TpSlOrdersDialog: FC<TpSlOrdersDialogProps> = ({
  open,
  onOpenChange,
  position,
}) => {
  const { t } = useLingui();
  const insts = useInstStore((state) => state.getInsts());
  const inst = position?.marketAddress
    ? insts[position.marketAddress]
    : undefined;
  const shortInstName = getShortInstName(inst);

  if (!position) return null;

  const titleText = position.isLong
    ? t`TP/SL: Close Long ${shortInstName}`
    : t`TP/SL: Close Short ${shortInstName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogShell
        dialogTitle={titleText}
        className="w-[560px]"
        overlayClassName="!pointer-events-none"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Content position={position} />
      </DialogShell>
    </Dialog>
  );
};

export default TpSlOrdersDialog;
