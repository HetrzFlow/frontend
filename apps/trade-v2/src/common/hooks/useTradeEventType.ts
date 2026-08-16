import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY } from '@repo/lib/format';
import { getTradeEventTypeTone } from '@/common/utils/tradeEventType';

export function useTradeEventType() {
  const { t } = useLingui();

  const labelMap = useMemo(
    () => ({
      market_open: t`Market Price Open`,
      market_increase: t`Market Price Increase`,
      market_close: t`Market Price Close`,
      market_decrease: t`Market Price Decrease`,
      deposit: t`Deposit`,
      withdrawal: t`Withdrawal`,
      failed_market_open: t`Failed Market Price Open`,
      failed_market_increase: t`Failed Market Price Increase`,
      failed_market_close: t`Failed Market Price Close`,
      failed_market_decrease: t`Failed Market Price Decrease`,
      failed_deposit: t`Failed Deposit`,
      failed_withdrawal: t`Failed Withdrawal`,
      limit_open: t`Limit Open`,
      limit_increase: t`Limit Increase`,
      created_limit: t`Created Limit`,
      updated_limit: t`Updated Limit`,
      failed_limit: t`Failed Limit`,
      cancelled_limit: t`Cancelled Limit`,
      tp_close: t`Take Profit Close`,
      tp_decrease: t`Take Profit Decrease`,
      created_tp: t`Created Take Profit`,
      updated_tp: t`Updated Take Profit`,
      failed_tp: t`Failed Take Profit`,
      cancelled_tp: t`Cancelled Take Profit`,
      sl_close: t`Stop Loss Close`,
      sl_decrease: t`Stop Loss Decrease`,
      created_sl: t`Created Stop Loss`,
      updated_sl: t`Updated Stop Loss`,
      failed_sl: t`Failed Stop Loss`,
      cancelled_sl: t`Cancelled Stop Loss`,
      liquidated: t`Liquidated`,
    }),
    [t],
  );

  const getLabel = (value: string) =>
    labelMap[value as keyof typeof labelMap] || EMPTY_DISPLAY;

  return {
    getLabel,
    getTone: getTradeEventTypeTone,
  };
}
