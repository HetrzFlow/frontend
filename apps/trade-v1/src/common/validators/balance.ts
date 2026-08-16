import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { calc } from '@repo/lib/calc';
import { thoFormat } from '@repo/lib/format';
import { NORMALIZED_SUI_TYPE_ARG } from '../chainClient/hooks';
import { MIN_REMAINING_SUI } from '../constants/common';

export const balanceValidator = ({
  coin,
  coinSize = '0',
  coinBalance,
  suiCoin,
  suiBalance,
}: {
  coin?: {
    coinType: string;
    decimal: number;
    symbol: string;
  };
  coinSize?: string;
  coinBalance?: string;
  suiCoin?: {
    decimal: number;
    symbol: string;
  };
  suiBalance?: string;
}) => {
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

  // sui balance lt MIN_REMAINING_SUI
  if (
    suiCoin &&
    calc(MIN_REMAINING_SUI)
      .plus(coin?.coinType === NORMALIZED_SUI_TYPE_ARG ? coinSize : 0)
      .times(Math.pow(10, suiCoin.decimal))
      .gt(suiBalance ?? 0)
  ) {
    const minSUI = thoFormat(MIN_REMAINING_SUI);
    return i18n._(msg`Remaining gas token < ${minSUI} SUI`);
  }
};
