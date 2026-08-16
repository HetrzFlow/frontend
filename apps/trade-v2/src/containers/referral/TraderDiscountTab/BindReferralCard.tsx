import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Button, Input, cn, LoaderCircleIcon } from '@repo/ui';
import { useNativeBalance, useReferralCodeValidation } from '@/common/hooks';
import { useBindReferralCode } from '@/hooks/useBindReferralCode';
import {
  REFERRAL_CODE_LENGTH,
  normalizeReferralCode,
} from '../referralCodeValidation';
import { useReferralStore } from '../referralStore';

interface BindReferralCardProps {
  initialCode?: string;
  focusOnMount?: boolean;
  onCancel?: () => void;
}

const BindReferralCard: FC<BindReferralCardProps> = ({
  initialCode,
  focusOnMount = false,
  onCancel,
}) => {
  const { t } = useLingui();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState(initialCode ?? '');
  const clearPendingRefCode = useReferralStore(
    (state) => state.clearPendingRefCode,
  );
  const bindReferralCode = useBindReferralCode();
  const normalizedCode = useMemo(() => normalizeReferralCode(code), [code]);
  const {
    hasSufficientBalance,
    isLoading: isNativeBalanceLoading,
    isConnected,
    insufficientHint,
  } = useNativeBalance();
  const isComplete = normalizedCode.length === REFERRAL_CODE_LENGTH;
  // Only run gas-fee validation once the 6-char referral code is fully entered,
  // so users aren't warned about gas before they even finish typing.
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
    refetch: refetchValidation,
  } = useReferralCodeValidation({
    code,
    mode: 'bind',
    skipOwnerValidation: isInsufficientGas,
  });
  const normalizedCodeLength = normalizedCode.length;
  const progressMessage = t`${normalizedCodeLength}/${REFERRAL_CODE_LENGTH} characters`;
  const bindDiscountLabel = t`Bind & Get Discount`;
  const validatingLabel = t`Validating`;
  const cancelLabel = t`Cancel`;
  const topMessage = canSubmit
    ? ''
    : isInsufficientGas
      ? insufficientHint
      : (errorMessage ?? progressMessage);
  const showAsError = hasError || isInsufficientGas;
  const buttonLabel = hasError ? t`Invalid Code` : bindDiscountLabel;
  const isDialogLayout = !!onCancel;
  const isSubmitDisabled =
    !canSubmit ||
    bindReferralCode.isPending ||
    (isComplete && (isNativeBalanceLoading || !hasSufficientBalance));

  useEffect(() => {
    if (initialCode !== undefined) {
      setCode(normalizeReferralCode(initialCode));
    }
  }, [initialCode]);

  useEffect(() => {
    if (!focusOnMount) return;

    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  const handleBind = async () => {
    if (!canSubmit) return;

    const latestValidation = await refetchValidation();
    if (!latestValidation.canSubmit) return;

    const result = await bindReferralCode.mutateAsync(normalizedCode);
    if (result?.success) {
      clearPendingRefCode();
      setCode('');
      onCancel?.();
    }
  };

  if (isDialogLayout) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <Input
            ref={inputRef}
            variant="ghost"
            value={normalizedCode}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. HZFL01"
            maxLength={REFERRAL_CODE_LENGTH}
            className={cn(
              'bg-bg-4 h-8 w-full rounded-xl px-2.5',
              hasError && '!border-destructive',
            )}
            inputClassName="text-foreground placeholder:text-foreground/30 text-[13px]/tight tracking-[-0.52px] font-normal"
          />
          <span
            className={`min-h-[15px] text-[13px]/tight tracking-[-0.52px] ${
              showAsError ? 'text-destructive' : 'text-foreground/70'
            }`}
          >
            {topMessage}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-bg-4 flex h-[42px] flex-1 items-center justify-center rounded-xl text-sm/tight font-medium hover:bg-white/10"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => void handleBind()}
            disabled={isSubmitDisabled}
            className="bg-accent hover:bg-accent/90 flex h-[42px] flex-1 items-center justify-center rounded-xl text-sm/tight font-medium text-black disabled:bg-white/10 disabled:text-white/30"
          >
            {isChecking ? (
              <span className="flex items-center justify-center gap-1.5">
                <LoaderCircleIcon size={16} className="animate-spin" />
                {validatingLabel}
              </span>
            ) : bindReferralCode.isPending ? (
              <span className="relative flex items-center justify-center">
                <span className="invisible">{bindDiscountLabel}</span>
                <LoaderCircleIcon size={16} className="absolute animate-spin" />
              </span>
            ) : (
              buttonLabel
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-foreground/10 flex min-w-0 flex-col gap-2 rounded-2xl border p-3 md:flex-1">
      <span
        className={`text-[13px]/tight tracking-[-0.52px] ${
          showAsError ? 'text-destructive' : 'text-foreground/70'
        }`}
      >
        {topMessage}
      </span>
      <div className="flex min-w-0 gap-2">
        <Input
          ref={inputRef}
          variant="ghost"
          value={normalizedCode}
          onChange={(e) => setCode(e.target.value)}
          maxLength={REFERRAL_CODE_LENGTH}
          className={cn(
            'min-w-0 flex-1 rounded-xl bg-white/10 px-2.5',
            hasError && '!border-destructive',
          )}
          inputClassName="text-foreground placeholder:text-foreground/30 text-[13px]/tight tracking-[-0.52px] font-normal"
        />
        <Button
          onClick={() => void handleBind()}
          disabled={isSubmitDisabled}
          className="bg-accent hover:bg-accent/90 h-8 shrink-0 rounded-xl px-4 text-[13px]/tight font-medium tracking-[-0.52px] text-black disabled:bg-white/10 disabled:text-white/30"
        >
          {isChecking ? (
            <span className="flex items-center justify-center gap-1.5">
              <LoaderCircleIcon size={14} className="animate-spin" />
              {validatingLabel}
            </span>
          ) : bindReferralCode.isPending ? (
            <span className="relative flex items-center justify-center">
              <span className="invisible">{bindDiscountLabel}</span>
              <LoaderCircleIcon size={14} className="absolute animate-spin" />
            </span>
          ) : (
            buttonLabel
          )}
        </Button>
      </div>
    </div>
  );
};

export default BindReferralCard;
