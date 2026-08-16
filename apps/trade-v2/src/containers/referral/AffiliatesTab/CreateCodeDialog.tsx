'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Button,
  Dialog,
  LoaderCircleIcon,
  DialogContent,
  DialogTitle,
  Input,
  XIcon,
  cn,
} from '@repo/ui';
import { useNativeBalance, useReferralCodeValidation } from '@/common/hooks';
import { useRegisterReferralCode } from '@/hooks/useReferralMutations';
import {
  REFERRAL_CODE_LENGTH,
  normalizeReferralCode,
} from '../referralCodeValidation';

interface CreateCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (code: string) => void;
}

const CreateCodeDialog: FC<CreateCodeDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const { t } = useLingui();
  const [code, setCode] = useState('');
  const [isClosingAfterSuccess, setIsClosingAfterSuccess] = useState(false);
  const registerReferralCode = useRegisterReferralCode();

  const normalizedCode = useMemo(() => normalizeReferralCode(code), [code]);
  const {
    hasSufficientBalance,
    isLoading: isNativeBalanceLoading,
    isConnected,
    insufficientHint,
  } = useNativeBalance();
  const isComplete = normalizedCode.length === REFERRAL_CODE_LENGTH;
  const isInsufficientGas =
    isComplete &&
    isConnected &&
    !isNativeBalanceLoading &&
    !hasSufficientBalance;
  const {
    canSubmit,
    errorMessage,
    hasError,
    isChecking,
    reason,
    refetch: refetchCodeOwner,
  } = useReferralCodeValidation({
    code,
    mode: 'create',
    skipOwnerValidation: isInsufficientGas,
  });
  const normalizedCodeLength = normalizedCode.length;
  const progressMessage = t`${normalizedCodeLength}/${REFERRAL_CODE_LENGTH} characters`;
  const suppressValidationMessage =
    registerReferralCode.isPending || isClosingAfterSuccess;
  const helperMessage =
    canSubmit || suppressValidationMessage
      ? ''
      : isInsufficientGas
        ? insufficientHint
        : (errorMessage ?? progressMessage);
  const showAsError =
    !suppressValidationMessage && (hasError || isInsufficientGas);
  const signAndCreateLabel = t`Sign & Create`;
  const confirmButtonLabel =
    reason === 'code_taken'
      ? t`Code Taken`
      : hasError
        ? t`Invalid Code`
        : signAndCreateLabel;
  const isConfirmDisabled =
    !canSubmit ||
    registerReferralCode.isPending ||
    isClosingAfterSuccess ||
    isNativeBalanceLoading ||
    !hasSufficientBalance;

  const handleConfirm = useCallback(async () => {
    if (!canSubmit || registerReferralCode.isPending) return;

    const latestValidation = await refetchCodeOwner();
    if (!latestValidation.canSubmit) {
      return;
    }

    const result = await registerReferralCode.mutateAsync(normalizedCode);
    if (!result?.success) return;

    setIsClosingAfterSuccess(true);
    onConfirm(normalizedCode);
    setCode('');
    onOpenChange(false);
  }, [
    canSubmit,
    normalizedCode,
    onConfirm,
    onOpenChange,
    refetchCodeOwner,
    registerReferralCode,
  ]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setCode('');
        setIsClosingAfterSuccess(false);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        position="center"
        closeClassName="hidden"
        overlayClassName="backdrop-blur-[8px]"
        className="bg-bg-3 w-[calc(100%-32px)] gap-4 rounded-2xl border-0 p-3 md:w-[440px] md:max-w-[440px]"
        aria-describedby={undefined}
      >
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DialogTitle className="text-base font-medium tracking-[-0.64px]">
              <Trans>Create Referral Code</Trans>
            </DialogTitle>
            <p className="text-foreground/70 text-xs">
              <Trans>
                Enter six unique alphanumeric characters, with at least one
                letter. Once created, it cannot be changed.
              </Trans>
            </p>
          </div>
          <button
            type="button"
            aria-label={t`Close`}
            className="text-foreground/50 hover:text-foreground flex size-6 shrink-0 items-center justify-center transition-colors"
            onClick={() => handleOpenChange(false)}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <Input
            variant="ghost"
            value={normalizedCode}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. HZFL01"
            maxLength={REFERRAL_CODE_LENGTH}
            className={cn(
              'bg-bg-4 h-8 w-full rounded-xl px-2.5',
              showAsError && '!border-[#E12E4B]',
            )}
            inputClassName="text-foreground placeholder:text-foreground/30 text-[13px]/normal tracking-[-0.52px] font-normal"
          />
          <p
            className={`min-h-[15px] text-xs ${
              showAsError ? 'text-[#E12E4B]' : 'text-foreground/70'
            }`}
          >
            {helperMessage}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-bg-4 flex h-[42px] flex-1 items-center justify-center rounded-xl text-sm font-medium hover:bg-white/10"
            onClick={() => handleOpenChange(false)}
          >
            <Trans>Cancel</Trans>
          </Button>
          <Button
            disabled={isConfirmDisabled}
            className="bg-accent hover:bg-accent/90 flex h-[42px] flex-1 items-center justify-center rounded-xl text-sm/tight font-medium text-black disabled:bg-white/10 disabled:text-white/30"
            onClick={() => void handleConfirm()}
          >
            {isChecking ? (
              <span className="flex items-center justify-center gap-1.5">
                <LoaderCircleIcon size={16} className="animate-spin" />
                {t`Validating`}
              </span>
            ) : registerReferralCode.isPending ? (
              <span className="relative flex items-center justify-center">
                <span className="invisible">{signAndCreateLabel}</span>
                <LoaderCircleIcon size={16} className="absolute animate-spin" />
              </span>
            ) : (
              confirmButtonLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCodeDialog;
