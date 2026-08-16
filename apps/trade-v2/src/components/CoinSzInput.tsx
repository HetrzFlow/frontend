import { FC, ReactNode, useCallback, useMemo } from 'react';

import { calc, truncate } from '@repo/lib/calc';
import {
  useGlobalStore,
  usePriceTickerStream,
  useInstStore,
  CoinSzInput as BasicCoinSzInput,
  CoinSelector,
  getUsdPriceSymbol,
} from '@/common';
import { useBalances } from '@/common/chainClient';
import {
  getPriceTickerExecutionPrice,
  type ExecutionPriceType,
} from '@/lib/trade/executionPrice';

interface CoinSzInputProps {
  label: ReactNode;
  showBalance?: boolean;
  px?: string;
  priceType?: ExecutionPriceType;
  priceSymbol?: string;
  balanceUnit?: string;
  balance?: string;
  balanceDisplay?: ReactNode;
  decimal?: number;
  dispDecimal?: number;
  inputSuffix?: ReactNode;
  isLong?: boolean;
  coin: string;
  value: string;
  excludeHzlp?: boolean;
  className?: string;
  defaultCoin?: string;
  isLoading?: boolean;
  percentActionSource?: 'slider' | 'button' | 'none';
  onChange: (value: {
    value: string;
    coin: string;
    token?: {
      symbol: string;
      decimals: number;
      decimal?: number;
      name?: string;
      logoURI?: string;
      price?: string;
      balance?: string;
    };
  }) => void;
  disabledCoinSelector?: boolean;
  disabled?: boolean;
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
  priceType,
  priceSymbol,
  balanceUnit,
  balance: balanceOverride,
  balanceDisplay,
  decimal,
  dispDecimal,
  inputSuffix,
  percentActionSource,
  isLoading,
  onChange,
  disabledCoinSelector,
  disabled,
}) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const coins = useInstStore((state) => state.getCoins());
  const coinObj = coins[coin];
  const coinSymbol = priceSymbol ?? getUsdPriceSymbol(coinObj?.symbol);
  const { data: coinTicker } = usePriceTickerStream(coinSymbol);
  const coinPrice = useMemo(() => {
    if (px) return px;
    if (!priceType) return coinTicker[0]?.p;

    return getPriceTickerExecutionPrice(coinTicker[0], {
      isIncrease: false,
      isLong: !!isLong,
      priceType,
    });
  }, [coinTicker, isLong, priceType, px]);
  const balances = useBalances();

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

  const calculatedBalance = useMemo(() => {
    // if not connect to wallet, display --
    if (!balances) return '';

    const balanceObj = balances.find((v) => v.address === coinObj?.address);
    // no balance, display 0
    if (!balanceObj || !balanceObj.totalBalance) return '0';

    return truncate(
      calc(balanceObj.totalBalance).div(Math.pow(10, coinObj?.decimal || 0)),
      coinObj?.decimal,
    );
  }, [balances, coinObj]);

  const balance = balanceOverride ?? calculatedBalance;

  const maxValue = balance;

  const handlePercentClick = useCallback(
    (value: string, action?: 'click' | 'drag') => {
      if (calc(maxValue).lte(0)) {
        return;
      }
      // if drag to update, not limit maxValue；if click to update, limit maxValue
      handleSzChange(
        action === 'click' && calc(maxValue).lt(value) ? maxValue : value,
      );
    },
    [maxValue, handleSzChange],
  );

  return (
    <BasicCoinSzInput
      disabled={disabled}
      isLong={isLong}
      percentActionSource={percentActionSource || 'slider'}
      className={className}
      isLoading={isLoading}
      label={label}
      value={value}
      showBalance={showBalance}
      balance={balance}
      balanceDisplay={balanceDisplay}
      balanceUnit={balanceUnit ?? coinObj?.symbol ?? ''}
      decimal={decimal ?? coinObj?.szInputDecimal}
      dispDecimal={dispDecimal ?? coinObj?.szDispDecimal}
      usdPx={coinPrice}
      usdDecimal={usdAmountDisplayDecimal}
      onValueChange={handleSzChange}
      onPercentChange={handlePercentClick}
      inputSuffix={
        inputSuffix ?? (
          <CoinSelector
            value={coin}
            onSelect={handleCoinChange}
            excludeHzlp={excludeHzlp}
            disabled={disabledCoinSelector}
          />
        )
      }
    />
  );
};

export default CoinSzInput;
