import { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Slippage from '@/components/hzlp/Slippage';
import { usePreferenceStore } from '@/stores/hzlp/preference';

interface SlippageContainerProps {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  type?: 'button' | 'text';
}

const SlippageContainer: FC<SlippageContainerProps> = ({
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
    <Slippage
      value={currentValue}
      onValueChange={handleValueChange}
      type={type}
      className={className}
    />
  );
};

export default SlippageContainer;
