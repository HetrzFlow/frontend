import { FC } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { Dialog, Loading, ScrollBox } from '@repo/ui';
import { type Position, useInstStore } from '@/common';
import { getShortInstName } from '@/common/utils/inst';
import DialogShell from '@/components/DialogShell';

const CloseDialogContent = dynamic(() => import('../CloseDialog/Content'), {
  ssr: false,
  loading: () => <Loading className="h-[508px]" />,
});

interface AddTpSlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position | null;
}

/**
 * AddTpSlDialog renders the CloseDialog in tpsl-only mode.
 * No Market/Limit tabs - only TP/SL form with adjusted max close size.
 */
const AddTpSlDialog: FC<AddTpSlDialogProps> = ({
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
        className="closePosDialog w-[440px]"
        overlayClassName="!pointer-events-none"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <ScrollBox
          className="scrollbar-none max-h-[calc(100dvh-72px)] overflow-y-auto"
          shadowClassName="to-bg-1"
        >
          <CloseDialogContent
            position={position}
            onOpenChange={onOpenChange}
            mode="tpsl-only"
          />
        </ScrollBox>
      </DialogShell>
    </Dialog>
  );
};

export default AddTpSlDialog;
