import { FC } from 'react';
import InputWithBtn from './InputWithBtn';
import InputWithSlider from './InputWithSlider';
import SimpleInput from './SimpleInput';
import { CoinSzInputProps } from './types';

const CoinSzInput: FC<
  CoinSzInputProps & { percentActionSource?: 'button' | 'slider' | 'none' }
> = ({ percentActionSource = 'button', ...props }) => {
  return percentActionSource === 'none' ? (
    <SimpleInput {...props} />
  ) : percentActionSource === 'slider' ? (
    <InputWithSlider {...props} />
  ) : (
    <InputWithBtn {...props} />
  );
};

export default CoinSzInput;
