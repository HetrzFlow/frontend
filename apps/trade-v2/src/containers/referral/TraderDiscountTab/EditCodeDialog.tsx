'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  useNativeBalance,
  useReferralCodeValidation,
  useReferralProfile,
} from '@/common/hooks';
import { useChangeReferralCode } from '@/hooks/useReferralMutations';
import {
  REFERRAL_CODE_LENGTH,
  normalizeReferralCode,
} from '../referralCodeValidation';

interface EditCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
}

const EditCodeDialog: FC<EditCodeDialogProps> = ({
  open,
  onOpenChange,
  initialCode,
}) => {
  const { t } = useLingui();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState(() =>
    normalizeReferralCode(initialCode ?? ''),
  );
  const [hasEditedCode, setHasEditedCode] = useState(false);
  const { data: profile } = useReferralProfile();
  const currentBoundCode = profile?.bound_referral_code ?? '';
  const changeReferralCode = useChangeReferralCode();

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
    refetch: refetchValidation,
  } = useReferralCodeValidation({
    code,
    mode: 'change',
    currentBoundCode,
    skipOwnerValidation: isInsufficientGas,
  });
  const normalizedCodeLength = normalizedCode.length;
  const progressMessage = t`${normalizedCodeLength}/${REFERRAL_CODE_LENGTH} characters`;
  const helperMessage = !hasEditedCode
    ? t`Current code bound.`
    : canSubmit
      ? ''
      : isInsufficientGas
        ? insufficientHint
        : (errorMessage ?? progressMessage);
  const showAsError = hasEditedCode && (hasError || isInsufficientGas);
  const showAsChecking = hasEditedCode && isChecking;
  const confirmButtonLabel =
    hasError && reason !== 'code_already_applied'
      ? t`Invalid Code`
      : t`Confirm Change`;
  const isConfirmDisabled =
    !canSubmit ||
    changeReferralCode.isPending ||
    isNativeBalanceLoading ||
    !hasSufficientBalance;

  const handleConfirm = useCallback(async () => {
    if (!canSubmit || changeReferralCode.isPending) return;

    const latestValidation = await refetchValidation();
    if (!latestValidation.canSubmit) return;

    const result = await changeReferralCode.mutateAsync(normalizedCode);
    if (!result?.success) return;

    setCode('');
    onOpenChange(false);
  }, [
    canSubmit,
    changeReferralCode,
    normalizedCode,
    onOpenChange,
    refetchValidation,
  ]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    const nextCode = normalizeReferralCode(initialCode ?? currentBoundCode);
    setCode(nextCode);
    // A code supplied from a referral URL is an edit candidate, so validate it
    // immediately instead of hiding its error behind the current-code hint.
    setHasEditedCode(
      initialCode !== undefined &&
        nextCode !== normalizeReferralCode(currentBoundCode),
    );
    inputRef.current?.focus();
  }, [currentBoundCode, initialCode, open]);

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
              <Trans>Edit Referral Code</Trans>
            </DialogTitle>
            <p className="text-foreground/70 text-xs">
              <Trans>
                Enter a new referral code to update your referrer. Your fee
                discount and their commission will apply to future trades.
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
            ref={inputRef}
            variant="ghost"
            value={normalizedCode}
            onChange={(event) => {
              setHasEditedCode(true);
              setCode(event.target.value);
            }}
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
            {showAsChecking ? (
              <span className="flex items-center justify-center gap-1.5">
                <LoaderCircleIcon size={16} className="animate-spin" />
                {t`Validating`}
              </span>
            ) : changeReferralCode.isPending ? (
              <span className="relative flex items-center justify-center">
                <span className="invisible">
                  <Trans>Confirm Change</Trans>
                </span>
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

export default EditCodeDialog;
