'use client';

import { useLingui } from '@lingui/react/macro';
import { Button, Dialog, DialogContent, DialogTitle, Skeleton } from '@repo/ui';

interface MeritsBoostLostWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meritsLost: string;
  isMeritsLoading: boolean;
  boostLostMultiplier: string;
  onConfirm: (dontShowAgain: boolean) => void;
}

export const MeritsBoostLostWarningDialog = ({
  open,
  onOpenChange,
  meritsLost,
  isMeritsLoading,
  boostLostMultiplier,
  onConfirm,
}: MeritsBoostLostWarningDialogProps) => {
  const { t } = useLingui();

  const rows = [
    { label: t`Merits Lost`, value: meritsLost, isLoading: isMeritsLoading },
  ];

  const confirmWithdraw = (dontShowAgain: boolean) => {
    onConfirm(dontShowAgain);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        position="center"
        closeClassName="top-3 right-3 text-white [&_svg]:size-5"
        className="bg-bg-3 w-[420px] !max-w-[420px] gap-4 rounded-2xl p-3"
      >
        <DialogTitle className="pr-8 text-base font-medium text-white">
          {t`Merits Boost Lost Warning`}
        </DialogTitle>

        <div className="flex flex-col gap-2">
          {isMeritsLoading ? (
            <Skeleton className="bg-bg-4 h-8 w-full" />
          ) : (
            <p className="text-t-270 text-xs">
              {t`Withdrawing an unmatured deposit forfeits its ${boostLostMultiplier}× Merits boost. Your earned 1× base Merits are kept.`}
            </p>
          )}

          <div className="flex flex-col gap-1">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-2 text-xs text-white"
              >
                <span
                  aria-hidden
                  className="flex size-4 shrink-0 items-center justify-center"
                >
                  <span className="bg-accent h-px w-2" />
                </span>
                <span>{row.label}:</span>
                {row.isLoading ? (
                  <Skeleton className="bg-bg-4 h-4 w-16" />
                ) : (
                  <span>{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Button
            variant="accent"
            onClick={() => confirmWithdraw(false)}
            className="w-full"
          >
            {t`I’m Aware of the Risk`}
          </Button>
          <Button
            variant="ghost"
            onClick={() => confirmWithdraw(true)}
            className="h-8 w-full text-xs text-white underline hover:bg-transparent hover:text-white"
          >
            {t`Do not show again`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
