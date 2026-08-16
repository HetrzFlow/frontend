import { FC, useCallback, useEffect } from 'react';

import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { ORDER_TYPE, TRADE_TYPE, useInstStore } from '@/common';
import BasicCoinSzInput from '@/components/CoinSzInput';
import { MARKET_PX } from '@/constants/common';
import { useGlobalStore } from '@/stores/trade/global';
import { useTradeStore } from '../../store';

interface CoinSzInputProps {
  label: React.ReactNode;
  coin: string;
  value: string;
  className?: string;
  defaultCoin?: string;
  onChange: (value: { value: string; coin: string }) => void;
}

const CoinSzInput: FC<CoinSzInputProps> = ({
  label,
  value,
  coin,
  className,
  defaultCoin = 'baseCoin',
  onChange,
}) => {
  const instId = useGlobalStore((state) => state.instId);
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInst(state, instId), state.getCoins()]),
  );
  const tradeType = useTradeStore((state) => state.tradeType);
  const isLong = tradeType === TRADE_TYPE.long;
  const orderType = useTradeStore((state) => state.orderType);
  const isMarket = orderType === ORDER_TYPE.market;
  const px = useWatch({ name: 'px' });

  const usdcCoin = Object.values(coins).find((v) => v.symbol === 'USDC');
  const collateralCoin = isLong ? inst?.baseCoin : usdcCoin?.coinType;

  const handleCoinChange = useCallback(
    (coin: string) => {
      onChange({ value, coin });
    },
    [onChange, value],
  );

  useEffect(() => {
    if (!coin) {
      setTimeout(() => {
        handleCoinChange(
          (isMarket
            ? defaultCoin === 'baseCoin' && inst?.baseCoin
              ? inst.baseCoin
              : usdcCoin?.coinType
            : collateralCoin) || '',
        );
      }, 0);
    }

    if (coin && !isMarket && coin !== collateralCoin) {
      setTimeout(() => {
        handleCoinChange(collateralCoin || '');
      }, 0);
    }
  }, [
    coin,
    isMarket,
    handleCoinChange,
    collateralCoin,
    inst,
    defaultCoin,
    usdcCoin,
  ]);

  return (
    <BasicCoinSzInput
      isLong={isLong}
      percentActionSource="slider"
      className={className}
      label={label}
      value={value}
      px={px === MARKET_PX || coin !== inst?.baseCoin ? '' : px}
      showBalance={true}
      coin={coin}
      onChange={onChange}
      disabledCoinSelector={!isMarket}
    />
  );
};

export default CoinSzInput;
