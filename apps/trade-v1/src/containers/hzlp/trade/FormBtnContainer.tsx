import { FC } from 'react';
import FormBtn from '@/components/hzlp/FormBtn';
import { useFormBtnState } from '@/hooks/hzlp/useFormBtnState';

interface FormBtnContainerProps {
  isBuy: boolean;
  isPending: boolean;
  isCalculating: boolean;
}

const FormBtnContainer: FC<FormBtnContainerProps> = ({
  isBuy,
  isPending,
  isCalculating,
}) => {
  const { validation, isDisabled, buttonClassName, showStates } =
    useFormBtnState({
      isBuy,
      isPending,
      isCalculating,
    });

  return (
    <FormBtn
      isDisabled={!!isDisabled}
      buttonClassName={buttonClassName}
      buttonText={validation.buttonText}
      showPending={showStates.isPending}
      showCalculating={!!showStates.showCalculating}
      showError={showStates.showError}
      showAble={showStates.showAble}
    />
  );
};

export default FormBtnContainer;
