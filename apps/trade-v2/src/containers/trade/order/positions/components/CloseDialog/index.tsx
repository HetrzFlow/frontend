import { FC } from 'react';

import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';

import { Dialog, Loading, ScrollBox } from '@repo/ui';
import { usePositions, useInstStore } from '@/common';
import { getShortInstName } from '@/common/utils/inst';
import DialogShell from '@/components/DialogShell';
import type { ORDER_TYPE } from '@/constants/enum';
import { useStableDialogValue } from '../hooks/useStableDialogValue';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[508px]" />,
});

interface CloseDialogProps {
  positionId: string;
  open: boolean;
  defaultValues?: {
    orderType: ORDER_TYPE;
  };
  /** When 'tpsl-only', hides Market/Limit tabs and defaults to TP/SL order type */
  mode?: 'default' | 'tpsl-only';
  onOpenChange: (open: boolean) => void;
}

const CloseDialog: FC<CloseDialogProps> = ({
  positionId,
  open,
  defaultValues,
  onOpenChange,
}) => {
  const { t } = useLingui();
  const { data: positions } = usePositions();
  const livePosition = positions?.find((v) => v.id === positionId);
  const position = useStableDialogValue(livePosition, {
    open,
    resetKey: positionId,
  });
  const { isLong, marketAddress } = position || {};
  const insts = useInstStore((state) => state.getInsts());
  const inst = marketAddress ? insts[marketAddress] : undefined;
  const shortInstName = getShortInstName(inst);

  if (!position) return null;

  const titleText = isLong
    ? t`Close Long ${shortInstName}`
    : t`Close Short ${shortInstName}`;

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
          shadowClassName="to-bg-3"
        >
          <Content
            position={position}
            onOpenChange={onOpenChange}
            defaultValues={defaultValues}
          />
        </ScrollBox>
      </DialogShell>
    </Dialog>
  );
};

export default CloseDialog;
