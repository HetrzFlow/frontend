import { FC, memo } from 'react';
import { cn } from '@repo/ui';
import { Slippage as BasicSlippage } from '@/common';

interface SlippageProps {
  className?: string;
  value: string;
  onValueChange: (value: string) => void;
  type?: 'button' | 'text';
}

const Slippage: FC<SlippageProps> = ({
  className,
  value,
  onValueChange,
  type = 'button',
}) => {
  return (
    <BasicSlippage
      value={value}
      onValueChange={onValueChange}
      type={type}
      className={cn('shrink-0', className)}
    />
  );
};

export default memo(Slippage);
