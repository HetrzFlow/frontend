'use client';

import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ConnectBtn, useIsConnect } from '@/common';
import FormBtn from '@/components/FormBtn';
import { LiqTradeType } from '@/stores/pools/trade';

interface Props {
  direction: LiqTradeType;
  isPending?: boolean;
}

const SimpleTradeFormBtn: FC<Props> = ({ direction, isPending = false }) => {
  const { t } = useLingui();
  const isConnected = useIsConnect;
  const isBuy = direction === LiqTradeType.Deposit;
  const buttonText = isBuy ? t`Deposit` : t`Withdraw`;

  // keep the same visual style with existing FormBtnContainer
  const buttonClassName = isBuy
    ? 'bg-up hover:bg-up/70 text-accent-foreground hover:text-accent-foreground/70 text-sm/tight'
    : 'bg-down hover:bg-down/70 text-accent-foreground hover:text-accent-foreground/70 text-sm/tight';

  if (!isConnected) {
    return <ConnectBtn className="w-full" />;
  }

  return (
    <FormBtn
      isDisabled={isPending}
      buttonClassName={buttonClassName}
      buttonText={buttonText}
      showPending={isPending}
      showCalculating={false}
      showError={false}
      showAble={!isPending}
    />
  );
};

export default SimpleTradeFormBtn;
