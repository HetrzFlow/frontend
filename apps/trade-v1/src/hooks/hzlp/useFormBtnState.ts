import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useFormValidation } from '@/hooks/hzlp/useFormValidation';

interface UseFormBtnStateParams {
  isBuy: boolean;
  isPending: boolean;
  isCalculating: boolean;
}

export const useFormBtnState = ({
  isBuy,
  isPending,
  isCalculating,
}: UseFormBtnStateParams) => {
  const paySz = useWatch({ name: 'paySz' });
  const receiveSz = useWatch({ name: 'receiveSz' });
  const { value: paySzValue, coin: payCoin } = paySz;
  const { coin: receiveCoin } = receiveSz;

  const validation = useFormValidation(
    isBuy,
    paySzValue || '',
    payCoin || '',
    receiveCoin || '',
    false,
    0,
    isCalculating,
  );

  const hasError = !validation.isValid;
  const showError = !isPending && !isCalculating && hasError;
  const showAble = !isPending && !isCalculating && !hasError;
  const showCalculating =
    !isPending && isCalculating && validation.isCalculating;

  const isDisabled = useMemo(
    () =>
      showError || isPending || validation.isInputDisabled || showCalculating,
    [showError, isPending, validation.isInputDisabled, showCalculating],
  );

  const buttonClassName = useMemo(() => {
    if (showError || showCalculating) {
      return isBuy
        ? 'disabled:bg-up/10 disabled:text-up/50 disabled:opacity-100'
        : 'disabled:bg-down/10 disabled:text-down/50 disabled:opacity-100';
    }
    return isBuy
      ? 'bg-up hover:bg-up/90 text-accent-foreground hover:text-accent-foreground/90'
      : 'bg-down hover:bg-down/90 text-accent-foreground hover:text-accent-foreground/90';
  }, [showError, showCalculating, isBuy]);

  return {
    validation,
    isDisabled,
    buttonClassName,
    showStates: {
      isPending,
      showCalculating,
      showError,
      showAble,
    },
  };
};
