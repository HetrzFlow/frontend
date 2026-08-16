import { FC, useCallback, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';


import { calc, truncate } from '@repo/lib/calc';
import { thoFormat } from '@repo/lib/format';
import { toast } from '@repo/ui';
import {
  MIN_REMAINING_SUI,
  useGlobalStore,
  usePriceTickerStream,
  useInstStore,
  CoinSzInput as BasicCoinSzInput,
  CoinSelector,
} from '@/common';
import { NORMALIZED_SUI_TYPE_ARG } from '@/constants/common';
import { useBalances } from '@/hooks/useAccount';

interface CoinSzInputProps {
  label: React.ReactNode;
  showBalance?: boolean;
  px?: string;
  isLong?: boolean;
  coin: string;
  value: string;
  excludeHzlp?: boolean;
  className?: string;
  defaultCoin?: string;
  isLoading?: boolean;
  percentActionSource?: 'slider' | 'button';
  onChange: (value: { value: string; coin: string }) => void;
  disabledCoinSelector?: boolean;
}

const CoinSzInput: FC<CoinSzInputProps> = ({
  label,
  value,
  isLong,
  coin,
  className,
  showBalance = true,
  excludeHzlp,
  px,
  percentActionSource,
  isLoading,
  onChange,
  disabledCoinSelector,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const coins = useInstStore((state) => state.getCoins());
  const coinObj = coins[coin];
  const coinSymbol = coinObj ? `${coinObj.symbol}/USD` : '';
  const { data: coinTicker } = usePriceTickerStream(coinSymbol);
  const coinPrice = px || coinTicker[0]?.p;
  const balances = useBalances([coin]);

  const handleSzChange = useCallback(
    (value: string) => {
      onChange({ value, coin });
    },
    [onChange, coin],
  );

  const handleCoinChange = useCallback(
    (coin: string) => {
      onChange({ value, coin });
    },
    [onChange, value],
  );

  const balance = useMemo(() => {
    // if not connect to wallet, display --
    if (!balances) return '';

    const balanceObj = balances[0];
    // no balance, display 0
    if (!balanceObj || !balanceObj.totalBalance) return '0';

    return truncate(
      calc(balanceObj.totalBalance).div(Math.pow(10, coinObj?.decimal || 0)),
      coinObj?.decimal,
    );
  }, [balances, coinObj]);

  const maxValue =
    coin === NORMALIZED_SUI_TYPE_ARG
      ? truncate(calc(balance).minus(MIN_REMAINING_SUI), coinObj?.decimal)
      : balance;

  const handlePercentClick = useCallback(
    (value: string, action?: 'click' | 'drag') => {
      if (calc(maxValue).lte(0)) {
        const minSUI = thoFormat(MIN_REMAINING_SUI);
        toast.error(
          t`Wallet balance must contain at least ${minSUI} SUI for gas fee`,
        );
        return;
      }
      // if drag to update, not limit maxValue；if click to update, limit maxValue
      handleSzChange(
        action === 'click' && calc(maxValue).lt(value) ? maxValue : value,
      );
    },
    [maxValue, handleSzChange, t],
  );

  return (
    <BasicCoinSzInput
      isLong={isLong}
      percentActionSource={percentActionSource || 'slider'}
      className={className}
      isLoading={isLoading}
      label={label}
      value={value}
      showBalance={showBalance}
      balance={balance}
      balanceUnit={coinObj?.symbol || ''}
      decimal={coinObj?.decimal}
      usdPx={coinPrice}
      usdDecimal={usdAmountDisplayDecimal}
      onValueChange={handleSzChange}
      onPercentChange={handlePercentClick}
      inputSuffix={
        <CoinSelector
          value={coin}
          onSelect={handleCoinChange}
          excludeHzlp={excludeHzlp}
          disabled={disabledCoinSelector}
        />
      }
    />
  );
};

export default CoinSzInput;
