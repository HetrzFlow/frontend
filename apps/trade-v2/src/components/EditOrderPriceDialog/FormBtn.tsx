import React, { FC } from 'react';

import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { useLingui } from '@lingui/react/macro';

import { Button, cn, LoaderCircleIcon } from '@repo/ui';

import { type Position } from '@/common';
import { useOrder } from './context';
import { useFormIsSubmitting } from './hooks/useFormAction';
import { useValidate } from './hooks/useValidate';

interface FormBtnProps {
  position?: Position;
}

const FormBtn: FC<FormBtnProps> = ({ position }) => {
  const { t } = useLingui();
  const { orderType } = useOrder();
  const isSubmitting = useFormIsSubmitting();
  const text = useValidate({ position });

  const hasError = !!text;
  const showError = !isSubmitting && hasError;
  const showAble = !isSubmitting && !hasError;

  const enableText =
    orderType === OrderType.LimitDecrease
      ? t`Update Take Profit Order`
      : orderType === OrderType.StopLossDecrease
        ? t`Update Stop Loss Order`
        : t`Update Limit Order`;

  return (
    <Button
      type="submit"
      disabled={hasError || isSubmitting}
      onClick={() => {}}
      className={cn(
        'bg-accent text-accent-foreground hover:bg-accent/70 disabled:bg-bg-4 disabled:hover:bg-bg-4 w-full text-xs',
      )}
    >
      {isSubmitting && (
        <>
          <LoaderCircleIcon size={16} className="animate-spin" />
          {enableText}
        </>
      )}
      {showError && text}
      {showAble && enableText}
    </Button>
  );
};

export default FormBtn;
