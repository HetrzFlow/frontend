import { FC, memo, useCallback } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { Leverage as BasicLeverage } from '@/common';
import { useTradeStore } from '../../store';

interface LeverageProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isLong: boolean;
}

const MAX_LEVER = 100;

const Leverage: FC<LeverageProps> = ({ className, isLong, onChange }) => {
  const [lever, setLever] = useTradeStore(
    useShallow((state) => [state.lever, state.setLever]),
  );

  const handleChange = useCallback(
    (lever: string) => {
      setLever(lever);
      onChange(lever);
    },
    [onChange, setLever],
  );

  return (
    <BasicLeverage
      className={className}
      value={lever}
      onChange={handleChange}
      isLong={isLong}
      maxLever={MAX_LEVER}
      sliderProps={{
        min: 1.1,
        max: MAX_LEVER,
        step: 0.1,
        scalePositions: [
          {
            value: 1.1,
            label: '1.1x',
            className: 'translate-x-0',
          },
          {
            value: MAX_LEVER / 4,
            label: `${MAX_LEVER / 4}x`,
          },
          {
            value: MAX_LEVER / 2,
            label: `${MAX_LEVER / 2}x`,
          },
          {
            value: (MAX_LEVER / 4) * 3,
            label: `${(MAX_LEVER / 4) * 3}x`,
          },
          {
            value: MAX_LEVER,
            label: `${MAX_LEVER}x`,
            className: '-translate-x-1/1',
          },
        ],
      }}
    />
  );
};

export default memo(Leverage);
