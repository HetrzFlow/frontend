'use client';

import { FC, useEffect } from 'react';

import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogTitle, Loading } from '@repo/ui';
import { scheduleIdleTask } from '@/lib/runtime/scheduleIdleTask';

const ShareDialogContent = dynamic(
  () => import('@/containers/trade/order/components/ShareDialog/Content'),
  {
    ssr: false,
    loading: () => <Loading className="h-[300px]" />,
  },
);

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLong: boolean;
  instName: string;
  instNameInImage: string;
  leverage?: string;
  pxDispDecimal?: number;
  entryPrice: string;
  markPrice?: string;
  exitPrice?: string;
  overridePnlPercent?: string | number;
  isZFP?: boolean;
}

const ShareDialog: FC<ShareDialogProps> = ({
  open,
  onOpenChange,
  ...contentProps
}) => {
  useEffect(() => {
    return scheduleIdleTask(() => {
      void import('@/containers/trade/order/components/ShareDialog/Content');
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-bg-1 w-[460px] overflow-hidden"
        aria-describedby={undefined}
        closeClassName="hidden"
      >
        <DialogTitle className="sr-only">Share</DialogTitle>

        <ShareDialogContent {...contentProps} />
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
