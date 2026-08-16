import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { useInstStore } from '@/common';
import { MARKET_PX } from '@/constants/common';
import BasicSzInput from '../../components/SzInput';
import { usePosition } from '../context';

const SzInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, value, onChange }) => {
  const { t } = useLingui();
  const { targetCoin, isLong, size } = usePosition();
  const [baseCoin, usdcCoin, inst] = useInstStore(
    useShallow((state) => [
      state.getCoins()[targetCoin],
      state.getUsdcCoin(state),
      state.getInstsArr().find((v) => v.coinType === targetCoin),
    ]),
  );

  const px = useWatch({ name: 'px' });
  const collateralCoin = isLong ? baseCoin : usdcCoin;

  return (
    <BasicSzInput
      value={value}
      label={t`Close Size`}
      onChange={onChange}
      className={className}
      px={!isLong || px === MARKET_PX ? '' : px}
      maxSize={size}
      max={size}
      coin={collateralCoin}
      inst={inst}
      inputSzIsCoin={false}
    />
  );
};

export default SzInput;
