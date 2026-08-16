import { FC, useCallback, useEffect } from 'react';

import { useIsCalcing } from '../../services/rest/swap';
import { useInstStore } from '../../stores/instStore';
import BasicCoinSzInput from './BasicCoinSzInput';

interface CoinSzInputProps {
  label: React.ReactNode;
  coin: string;
  value: string;
  showBalance: boolean;
  className?: string;
  defaultCoin?: string;
  onChange: (value: { value: string; coin: string }) => void;
}

const CoinSzInput: FC<CoinSzInputProps> = ({
  label,
  value,
  coin,
  showBalance,
  className,
  defaultCoin = 'baseCoin',
  onChange,
}) => {
  const coins = useInstStore((state) => state.getCoins());
  const usdcCoin = Object.values(coins).find((v) => v.symbol === 'USDC');
  const suiCoin = Object.values(coins).find((v) => v.symbol === 'SUI');
  const coinObj = coins[coin];

  const { data: isCalcing } = useIsCalcing(coinObj?.coinType);

  const handleCoinChange = useCallback(
    (coin: string) => {
      onChange({ value, coin });
    },
    [onChange, value],
  );

  useEffect(() => {
    if (!coinObj) {
      setTimeout(() => {
        handleCoinChange(
          (defaultCoin === 'baseCoin'
            ? suiCoin?.coinType
            : usdcCoin?.coinType) ||
            suiCoin?.coinType ||
            '',
        );
      }, 0);
    }
  }, [coinObj, handleCoinChange, suiCoin, defaultCoin, usdcCoin]);

  return (
    <BasicCoinSzInput
      isLoading={!!isCalcing}
      percentActionSource="button"
      className={className}
      label={label}
      value={value}
      showBalance={showBalance}
      coin={coin}
      excludeHzlp
      onChange={onChange}
    />
  );
};

export default CoinSzInput;
