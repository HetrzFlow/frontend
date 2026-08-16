import { FC } from 'react';
import InputWithBtn from './InputWithBtn';
import InputWithSlider from './InputWithSlider';
import { CoinSzInputProps } from './types';

const CoinSzInput: FC<
  CoinSzInputProps & { percentActionSource?: 'button' | 'slider' }
> = ({ percentActionSource = 'button', ...props }) => {
  return percentActionSource === 'slider' ? (
    <InputWithSlider {...props} />
  ) : (
    <InputWithBtn {...props} />
  );
};

export default CoinSzInput;
