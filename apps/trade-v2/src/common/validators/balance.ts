import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { calc } from '@repo/lib/calc';

export const balanceValidator = ({
  coin,
  coinSize = '0',
  coinBalance,
}: {
  coin?: {
    decimal: number;
    symbol: string;
  };
  coinSize?: string;
  coinBalance?: string;
  nativeCoin?: {
    decimal: number;
    symbol: string;
  };
  nativeCoinBalance?: string;
} = {}) => {
  // coin balance insufficient
  if (
    coin &&
    calc(coinSize)
      .times(Math.pow(10, coin.decimal))
      .gt(coinBalance ?? 0)
  ) {
    const coinName = coin.symbol;
    return i18n._(msg`Insufficient ${coinName} balance`);
  }
};
