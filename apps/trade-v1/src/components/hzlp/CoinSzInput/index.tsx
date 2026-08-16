import { FC, memo, ReactNode } from 'react';
import { CoinSzInput as BasicCoinSzInput } from '@/common';

interface CoinSzInputProps {
  disabled?: boolean;
  label: string;
  balance: string;
  usdPx?: string;
  isLoading: boolean;
  showBalance: boolean;
  balanceUnit: string;
  value: string;
  decimal?: number;
  onValueChange: (value: string) => void;
  onPercentChange: (value: string) => void;
  inputSuffix: ReactNode;
}

const CoinSzInput: FC<CoinSzInputProps> = ({
  disabled,
  label,
  balance,
  usdPx,
  isLoading,
  showBalance,
  balanceUnit,
  value,
  decimal,
  onValueChange,
  onPercentChange,
  inputSuffix,
}) => {
  return (
    <BasicCoinSzInput
      disabled={disabled}
      label={label}
      balance={balance}
      usdPx={usdPx}
      isLoading={isLoading}
      showBalance={showBalance}
      balanceUnit={balanceUnit}
      value={value}
      decimal={decimal}
      onValueChange={onValueChange}
      onPercentChange={onPercentChange}
      inputSuffix={inputSuffix}
    />
  );
};

export default memo(CoinSzInput);
