import { FC } from 'react';
import { LoaderCircleIcon } from '@repo/ui';
import { usePrivy } from '@/common/chainClient';
import VaultTradeActionButton from '@/common/components/VaultTradeActionButton';
import { LiqTradeType } from '@/stores/pools/trade';
import { PoolTradeButtonState } from './usePoolTradeValidation';

interface PoolTradeFormBtnProps {
  direction: LiqTradeType;
  buttonState: PoolTradeButtonState;
  buttonText: string;
  isDisabled: boolean;
  isLoading: boolean;
  onApprove?: () => void;
  onSubmit?: () => void;
  className?: string;
  variant?: 'vault' | 'genesis';
  submitViaForm?: boolean;
}

const PoolTradeFormBtn: FC<PoolTradeFormBtnProps> = ({
  direction,
  buttonState,
  buttonText,
  isDisabled,
  isLoading,
  onApprove,
  onSubmit,
  className,
  variant = 'vault',
  submitViaForm = true,
}) => {
  const { connectOrCreateWallet } = usePrivy();
  const handleTradeButtonAction = () => {
    if (isDisabled) {
      return;
    }
    if (buttonState === PoolTradeButtonState.NOT_CONNECTED) {
      connectOrCreateWallet();
      return;
    }
    if (buttonState === PoolTradeButtonState.NEED_APPROVE) {
      onApprove?.();
      return;
    }
    if (
      buttonState === PoolTradeButtonState.DEPOSIT_READY ||
      buttonState === PoolTradeButtonState.WITHDRAW_READY
    ) {
      onSubmit?.();
      return;
    }
  };

  const isActionable =
    buttonState === PoolTradeButtonState.NOT_CONNECTED ||
    buttonState === PoolTradeButtonState.NEED_APPROVE ||
    buttonState === PoolTradeButtonState.DEPOSIT_READY ||
    buttonState === PoolTradeButtonState.WITHDRAW_READY;

  const isErrorState =
    buttonState === PoolTradeButtonState.INSUFFICIENT_BALANCE ||
    buttonState === PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT ||
    buttonState === PoolTradeButtonState.ABOVE_WITHDRAW_LIMIT ||
    buttonState === PoolTradeButtonState.POOL_PAUSED ||
    buttonState === PoolTradeButtonState.PNL_FACTOR_EXCEEDED ||
    buttonState === PoolTradeButtonState.BELOW_MIN_DEPOSIT;

  const shouldSubmitForm =
    buttonState === PoolTradeButtonState.DEPOSIT_READY ||
    buttonState === PoolTradeButtonState.WITHDRAW_READY;

  const finalDisabled = isDisabled || isLoading || isErrorState;
  const allowCustomStyle = !finalDisabled;

  return (
    <VaultTradeActionButton
      action={direction === LiqTradeType.Deposit ? 'deposit' : 'withdraw'}
      variant={variant}
      emphasized={allowCustomStyle && isActionable}
      type={
        shouldSubmitForm && !finalDisabled && submitViaForm
          ? 'submit'
          : 'button'
      }
      onClick={handleTradeButtonAction}
      disabled={finalDisabled}
      className={className}
    >
      {isLoading && (
        <LoaderCircleIcon size={16} className="mr-2 animate-spin" />
      )}
      {buttonText}
    </VaultTradeActionButton>
  );
};

export default PoolTradeFormBtn;
