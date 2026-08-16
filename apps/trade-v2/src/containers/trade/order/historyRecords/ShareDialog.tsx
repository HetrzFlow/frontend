'use client';

import { FC } from 'react';

import { useInstStore } from '@/common';

import ShareDialog from '@/containers/trade/order/components/ShareDialog';

interface HistoryShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLong: boolean;
  marketAddress: string;
  entryPrice: string;
  exitPrice: string;
  sizeDeltaUsd: string;
  collateralDeltaAmount: string;
  collateralTokenPx: string;
  pnlUsd: string;
  pnlPercent: string;
  leverage?: string;
  isZFP?: boolean;
}

const HistoryShareDialog: FC<HistoryShareDialogProps> = ({
  open,
  onOpenChange,
  isLong,
  marketAddress,
  entryPrice,
  exitPrice,
  pnlPercent,
  leverage,
  isZFP,
}) => {
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[marketAddress];

  if (!inst) return null;

  return (
    <ShareDialog
      open={open}
      onOpenChange={onOpenChange}
      isLong={isLong}
      instName={inst.name}
      instNameInImage={inst.name.replace('/', '-')}
      leverage={leverage}
      pxDispDecimal={inst.pxDispDecimal}
      entryPrice={entryPrice}
      exitPrice={exitPrice}
      overridePnlPercent={pnlPercent}
      isZFP={isZFP}
    />
  );
};

export default HistoryShareDialog;
