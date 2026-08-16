import { FC } from 'react';
import { cn, LoaderCircleIcon } from '@repo/ui';
import BaseFormBtn from '../BaseFormBtn';

interface FormBtnProps {
  isDisabled: boolean;
  buttonClassName: string;
  buttonText: string;
  showPending: boolean;
  showCalculating: boolean;
  showError: boolean;
  showAble: boolean;
}

const FormBtn: FC<FormBtnProps> = ({
  isDisabled,
  buttonClassName,
  buttonText,
  showPending,
  showCalculating,
  showError,
  showAble,
}) => {
  return (
    <BaseFormBtn
      disabled={isDisabled}
      onClick={() => {}}
      className={cn('w-full', buttonClassName)}
    >
      {showPending && (
        <>
          <LoaderCircleIcon size={16} className="animate-spin" />
          {buttonText}
        </>
      )}
      {showCalculating && (
        <>
          <LoaderCircleIcon size={16} className="animate-spin" />
          {buttonText}
        </>
      )}
      {showError && buttonText}
      {showAble && buttonText}
    </BaseFormBtn>
  );
};

export default FormBtn;
