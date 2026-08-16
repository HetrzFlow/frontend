import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { useInstStore } from '@/common';
import { getShortInstName } from '@/common/utils/inst';
import { MARKET_PX } from '@/constants/trade';
import BasicSzInput from '../../../components/SzInput';
import { usePosition } from '../../context';

const SzInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, value, onChange }) => {
  const { t } = useLingui();
  const { sizeInUsd, marketAddress, collateralTokenAddress } = usePosition();
  const [coins, inst] = useInstStore(
    useShallow((state) => [state.getCoins(), state.getInsts()[marketAddress]]),
  );

  const px = useWatch({ name: 'px' });
  const collateralCoin = coins[collateralTokenAddress || ''];
  const collateralCoinIsInstCoin =
    getShortInstName(inst) === collateralCoin?.symbol;

  return (
    <BasicSzInput
      value={value}
      label={t`Close Size`}
      onChange={onChange}
      className={className}
      numberInputClassName="bg-bg-4"
      px={!collateralCoinIsInstCoin || px === MARKET_PX ? '' : px}
      maxSize={sizeInUsd}
      max={sizeInUsd}
      coin={collateralCoin}
      inst={inst}
      inputSzIsCoin={false}
      showEstimatedValue={false}
    />
  );
};

export default SzInput;
