import { FC } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { cn } from '@repo/ui';
import BasicSlippage from '../../components/Slippage';
import { useSwapStore } from './store';

interface SlippageProps {
  className?: string;
}

const Slippage: FC<SlippageProps> = ({ className }) => {
  const [slippage, setSlippage] = useSwapStore(
    useShallow((state) => [state.slippage, state.setSlippage]),
  );

  return (
    <BasicSlippage
      value={slippage}
      onValueChange={setSlippage}
      className={cn('shrink-0', className)}
      options={['0.001', '0.005', '0.01']}
      warningSlippage="0.005"
    />
  );
};

export default Slippage;
