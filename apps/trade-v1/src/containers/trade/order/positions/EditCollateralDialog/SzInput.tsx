import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc, truncate } from '@repo/lib/calc';
import { MIN_REMAINING_SUI, useGlobalStore, useInstStore } from '@/common';
import {
  MIN_RESIDUAL_COLLATERAL,
  NORMALIZED_SUI_TYPE_ARG,
} from '@/constants/common';

import { useBalances } from '@/hooks/useAccount';
import BasicSzInput from '../../components/SzInput';
import { usePosition } from '../context';
import { TYPE } from './enum';

const SzInput: FC<{
  className?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ className, value, onChange }) => {
  const { t } = useLingui();
  const { targetCoin, isLong, collateral } = usePosition();
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);
  const [baseCoin, usdcCoin, inst] = useInstStore(
    useShallow((state) => [
      state.getCoins()[targetCoin],
      state.getUsdcCoin(state),
      state.getInstsArr().find((v) => v.coinType === targetCoin),
    ]),
  );
  const type = useWatch({ name: 'type' });
  const isDeposit = type === TYPE.deposit;
  const collateralCoin = isLong ? baseCoin : usdcCoin;

  const balances = useBalances(collateralCoin ? [collateralCoin.coinType] : []);

  const balance = useMemo(() => {
    // not connect to wallet, display --
    if (!balances) return '';

    const balanceObj = balances[0];
    // no balance, display 0
    if (!balanceObj || !balanceObj.totalBalance) return '0';

    return truncate(
      calc(balanceObj.totalBalance).div(
        Math.pow(10, collateralCoin?.decimal || 0),
      ),
      collateralCoin?.decimal,
    );
  }, [balances, collateralCoin]);

  const maxSize = isDeposit
    ? collateralCoin?.coinType === NORMALIZED_SUI_TYPE_ARG
      ? truncate(
          calc(balance).minus(MIN_REMAINING_SUI),
          collateralCoin?.decimal,
        )
      : balance
    : truncate(
        calc.max(0, calc(collateral).minus(MIN_RESIDUAL_COLLATERAL)),
        usdAmountDecimal,
      );

  return (
    <BasicSzInput
      value={value}
      label={isDeposit ? t`Deposit` : t`Withdraw`}
      onChange={onChange}
      className={className}
      maxSize={maxSize}
      max={isDeposit ? balance : maxSize}
      coin={collateralCoin}
      inst={inst}
      inputSzIsCoin={isDeposit}
    />
  );
};

export default SzInput;
