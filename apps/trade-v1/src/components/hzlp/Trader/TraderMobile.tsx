import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui';
import { HzlpTraderType } from '@/constants/hzlp/enum';

interface TraderMobileProps {
  onBuyClick: () => void;
  onSellClick: () => void;
  children: React.ReactNode;
}

const TraderMobile: FC<TraderMobileProps> = ({
  onBuyClick,
  onSellClick,
  children,
}) => {
  const { t } = useLingui();

  return (
    <div className="fixed bottom-18 left-0 w-full px-4">
      <Dialog>
        <div className="mb-4 flex w-full items-center justify-between gap-1">
          <DialogTrigger className="h-10 w-full">
            <div
              onClick={onBuyClick}
              className="bg-up text-accent-foreground flex h-10 w-full items-center justify-center gap-1 rounded-[100px] text-sm font-medium"
            >
              {t`Buy Hzlp`}
            </div>
          </DialogTrigger>
          <DialogTrigger className="h-10 w-full">
            <div
              onClick={onSellClick}
              className="bg-down text-accent-foreground flex h-10 w-full items-center justify-center gap-1 rounded-[100px] text-sm font-medium"
            >
              {t`Sell Hzlp`}
            </div>
          </DialogTrigger>
        </div>
        <DialogContent closeClassName="hidden">
          <DialogHeader>
            <DialogTitle className="hidden">Trade Hzlp</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(TraderMobile);

