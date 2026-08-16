import { FC } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { cn } from '@repo/ui';
import { Slippage as BasicSlippage } from '@/common';

import { usePreferenceStore } from '@/stores/hzlp/preference';

interface SlippageProps {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  type?: 'button' | 'text';
}

const Slippage: FC<SlippageProps> = ({
  className,
  value: externalValue,
  onValueChange: externalOnValueChange,
  type = 'button',
}) => {
  const [slippage, setSlippage] = usePreferenceStore(
    useShallow((state) => [state.slippage, state.setSlippage]),
  );

  const currentValue = externalValue !== undefined ? externalValue : slippage;
  const handleValueChange = externalOnValueChange || setSlippage;

  return (
    <BasicSlippage
      value={currentValue}
      onValueChange={handleValueChange}
      type={type}
      className={cn('shrink-0', className)}
    />
  );
};

export default Slippage;
