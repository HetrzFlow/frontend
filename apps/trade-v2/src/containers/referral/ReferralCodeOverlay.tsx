'use client';

import {
  FC,
  TransitionEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  LoaderCircleIcon,
  Button,
  CheckCircleIcon,
  cn,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@repo/ui';
import { useNativeBalance, useReferralCodeValidation } from '@/common/hooks';
import { useBindReferralCode } from '@/hooks/useBindReferralCode';
import {
  REFERRAL_CODE_LENGTH,
  normalizeReferralCode,
} from './referralCodeValidation';

interface ReferralCodeOverlayProps {
  initialCode?: string;
  isExiting?: boolean;
  bindSucceeded?: boolean;
  discountBps?: number;
  onBindSuccess: () => void;
  onSkip: () => void;
  onExited?: () => void;
}

const ReferralCodeOverlay: FC<ReferralCodeOverlayProps> = ({
  initialCode,
  isExiting = false,
  bindSucceeded = false,
  discountBps,
  onBindSuccess,
  onSkip,
  onExited,
}) => {
  const { t } = useLingui();
  const bindReferralCode = useBindReferralCode();
  const [referralCode, setReferralCode] = useState(initialCode ?? '');
  const otpInputRef = useRef<HTMLInputElement>(null);

  const normalizedReferralCode = useMemo(() => {
    return normalizeReferralCode(referralCode);
  }, [referralCode]);
  const {
    hasSufficientBalance,
    isLoading: isNativeBalanceLoading,
    isConnected,
    insufficientHint,
  } = useNativeBalance();
  const isComplete = normalizedReferralCode.length === REFERRAL_CODE_LENGTH;
  // Only surface the gas-fee warning after the 6-char referral code is fully entered.
  const isInsufficientGas =
    isComplete &&
    isConnected &&
    !isNativeBalanceLoading &&
    !hasSufficientBalance;
  const { canSubmit, errorMessage, hasError, isChecking } =
    useReferralCodeValidation({
      code: referralCode,
      mode: 'bind',
      skipOwnerValidation: isInsufficientGas,
    });
  const isBinding = bindReferralCode.isPending;
  const showAsError = hasError || isInsufficientGas;
  const errorHint = isInsufficientGas ? insufficientHint : errorMessage;
  const buttonLabel = isBinding
    ? t`Binding...`
    : hasError
      ? t`Invalid Code`
      : t`Bind & Get Discount`;
  const discountPercent = discountBps ? discountBps / 100 : 0;
  const successDiscountText =
    discountPercent > 0
      ? t`Code Bound! Getting ${discountPercent}% discount`
      : t`Code Bound!`;

  useEffect(() => {
    setReferralCode(initialCode ?? '');
  }, [initialCode]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (!isExiting) return;
    if (event.target !== event.currentTarget) return;
    onExited?.();
  };
  const focusOtpInput = useCallback(() => {
    otpInputRef.current?.focus();
  }, []);
  const handleBind = useCallback(async () => {
    try {
      const result = await bindReferralCode.mutateAsync(normalizedReferralCode);
      if (result?.success) {
        onBindSuccess();
      }
    } catch {
      // The mutation hook already surfaces the error toast.
    }
  }, [bindReferralCode, normalizedReferralCode, onBindSuccess]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] overflow-hidden bg-black transition-opacity duration-300',
        isExiting ? 'opacity-0' : 'animate-in fade-in opacity-100 duration-500',
      )}
      onTransitionEnd={handleTransitionEnd}
    >
      <video
        src="/trade-static/videos/heroVcompressed2.mp4"
        autoPlay
        controls={false}
        loop
        muted
        playsInline
        preload="auto"
        poster="/trade-static/referral-share-bg.png"
        disablePictureInPicture
        aria-hidden
        tabIndex={-1}
        onContextMenu={(event) => event.preventDefault()}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 md:px-6">
        <div
          className={cn(
            'flex w-full max-w-[501px] flex-col items-center gap-10',
            isExiting
              ? 'translate-y-2 opacity-0 transition-all duration-200'
              : 'animate-in fade-in slide-in-from-bottom-4 duration-500',
          )}
        >
          <div className="flex w-full flex-col items-center gap-6">
            <h2 className="text-center text-[42px]/tight font-medium tracking-[-1.68px] max-md:text-[32px]/tight">
              {t`Got a code? Plug it in`}
            </h2>

            <p className="text-foreground/70 text-center text-xs/[1.2]">
              {t`Enter a valid referral code to activate your fee discount. Your referrer earns commission on every trade you make.`}
            </p>

            <div
              className="w-full max-w-[408px]"
              onClickCapture={focusOtpInput}
            >
              <InputOTP
                ref={otpInputRef}
                inputMode="text"
                value={normalizedReferralCode}
                onChange={(value) => {
                  setReferralCode(normalizeReferralCode(value));
                }}
                maxLength={REFERRAL_CODE_LENGTH}
                pattern="^[a-zA-Z0-9]+$"
                containerClassName="justify-center gap-3"
              >
                {Array.from({ length: REFERRAL_CODE_LENGTH }).map(
                  (_, index) => (
                    <InputOTPGroup
                      key={index}
                      className="w-[50px] justify-center md:w-[58px]"
                    >
                      <InputOTPSlot
                        index={index}
                        className={cn(
                          'border-foreground/10 h-[44px] w-[50px] rounded-lg border bg-transparent text-[32px]/tight font-medium shadow-none ring-0 first:rounded-lg first:border last:rounded-lg md:h-[60px] md:w-[58px]',
                          showAsError &&
                            '!border-[#e12e4b] data-[active=true]:!border-[#e12e4b] data-[active=true]:!ring-0',
                        )}
                      />
                    </InputOTPGroup>
                  ),
                )}
              </InputOTP>
            </div>

            {showAsError && errorHint ? (
              <p className="text-center text-xs/[1.2] text-[#e12e4b]">
                {errorHint}
              </p>
            ) : null}

            <Button
              onClick={() => void handleBind()}
              disabled={
                !canSubmit ||
                isBinding ||
                bindSucceeded ||
                (isComplete &&
                  (isNativeBalanceLoading || !hasSufficientBalance))
              }
              className={cn(
                'h-[46px] rounded-xl px-10 text-[13px]/tight font-medium tracking-[-0.52px] max-md:w-full max-md:max-w-[280px]',
                bindSucceeded
                  ? 'text-foreground/70 bg-white/10 disabled:bg-white/10 disabled:opacity-100'
                  : 'bg-accent hover:bg-accent/90 text-black disabled:bg-white/10',
              )}
            >
              {bindSucceeded ? (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckCircleIcon size={16} className="text-green" />
                  {successDiscountText}
                </span>
              ) : isChecking ? (
                <span className="flex items-center justify-center gap-1.5">
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  {t`Validating`}
                </span>
              ) : isBinding ? (
                <span className="relative flex items-center justify-center">
                  <span className="invisible">{t`Bind & Get Discount`}</span>
                  <LoaderCircleIcon
                    size={16}
                    className="absolute animate-spin"
                  />
                </span>
              ) : (
                buttonLabel
              )}
            </Button>
          </div>

          <p className="">
            <button
              type="button"
              onClick={onSkip}
              disabled={isBinding || bindSucceeded}
              className="hover:text-t-270 text-t-1100 text-center text-sm underline transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trans>Don&apos;t have an referral code? Skip for now</Trans>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReferralCodeOverlay;
