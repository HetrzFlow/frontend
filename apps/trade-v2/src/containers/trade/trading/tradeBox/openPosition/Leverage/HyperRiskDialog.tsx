import { FC, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  WarningIcon,
} from '@repo/ui';

interface HyperRiskDialogProps {
  open: boolean;
  onAcknowledge: () => void;
  onDoNotShowAgain: () => void;
  onClose: () => void;
}

const HyperRiskDialog: FC<HyperRiskDialogProps> = ({
  open,
  onAcknowledge,
  onDoNotShowAgain,
  onClose,
}) => {
  const { t } = useLingui();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-bg-3 w-[calc(100%-32px)] gap-4 rounded-2xl p-3 md:w-[440px] md:max-w-[440px]"
        closeClassName="-translate-y-1.5"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <WarningIcon size={20} className="text-t-1100" />
            <DialogTitle className="text-t-1100 text-base font-medium">
              {t`Hyper Leverage Restrictions`}
            </DialogTitle>
          </div>
        </div>

        <p className="text-t-270 text-xs">
          {t`Market orders only. Collateral withdrawal disabled. 0% open/close fee, with conditional profit sharing on gains. Please trade responsibly and only risk capital you can afford to lose.`}
        </p>

        <div className="flex flex-col items-center gap-1">
          <Button
            className="bg-hyper-lev text-accent-foreground hover:bg-hyper-lev/90 h-8 w-full rounded-xl text-xs font-medium"
            onClick={onAcknowledge}
          >
            {t`I'm Aware of the Risk`}
          </Button>
          <Button
            variant="link"
            className="text-t-1100 hover:text-t-270 h-8 w-max text-xs font-medium underline decoration-solid underline-offset-2"
            onClick={onDoNotShowAgain}
          >
            {t`Do not show again`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HyperRiskDialog;
