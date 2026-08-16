import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ORDER_TAB_VALUE } from '@/constants/enum';

import { useOrdersStore } from '../store';
import type { TreeFilterOption } from '../components/TreeFilter';

export const getHistoryActionSelectedCount = (value?: string) => {
  return value ? value.split(',').filter(Boolean).length : 0;
};

export const useHistoryActionFilter = () => {
  const { t } = useLingui();
  const historyFilterState = useOrdersStore(
    (state) => state.historyFilterState,
  );
  const setFilterState = useOrdersStore((state) => state.setFilterState);
  const value = historyFilterState.find((filter) => filter.id === 'action')
    ?.value as string | undefined;

  return useMemo(() => {
    const options: TreeFilterOption[] = [
      {
        value: 'market',
        label: t`Market Orders`,
        children: [
          { value: 'market_open', label: t`Market Price Open` },
          { value: 'market_increase', label: t`Market Price Increase` },
          { value: 'market_close', label: t`Market Price Close` },
          { value: 'market_decrease', label: t`Market Price Decrease` },
          { value: 'deposit', label: t`Deposit` },
          { value: 'withdrawal', label: t`Withdrawal` },
          { value: 'failed_market_open', label: t`Failed Market Price Open` },
          {
            value: 'failed_market_increase',
            label: t`Failed Market Price Increase`,
          },
          { value: 'failed_market_close', label: t`Failed Market Price Close` },
          {
            value: 'failed_market_decrease',
            label: t`Failed Market Price Decrease`,
          },
          { value: 'failed_deposit', label: t`Failed Deposit` },
          { value: 'failed_withdrawal', label: t`Failed Withdrawal` },
        ],
      },
      {
        value: 'limit',
        label: t`Limit Orders`,
        children: [
          { value: 'limit_open', label: t`Limit Open` },
          { value: 'limit_increase', label: t`Limit Increase` },
          { value: 'created_limit', label: t`Created Limit` },
          { value: 'updated_limit', label: t`Updated Limit` },
          { value: 'cancelled_limit', label: t`Cancelled Limit` },
          { value: 'failed_limit', label: t`Failed Limit` },
        ],
      },
      {
        value: 'take_profit',
        label: t`Take Profit`,
        children: [
          { value: 'tp_close', label: t`Take Profit Close` },
          { value: 'tp_decrease', label: t`Take Profit Decrease` },
          { value: 'created_tp', label: t`Created Take Profit` },
          { value: 'updated_tp', label: t`Updated Take Profit` },
          { value: 'cancelled_tp', label: t`Cancelled Take Profit` },
          { value: 'failed_tp', label: t`Failed Take Profit` },
        ],
      },
      {
        value: 'stop_loss',
        label: t`Stop Loss`,
        children: [
          { value: 'sl_close', label: t`Stop Loss Close` },
          { value: 'sl_decrease', label: t`Stop Loss Decrease` },
          { value: 'created_sl', label: t`Created Stop Loss` },
          { value: 'updated_sl', label: t`Updated Stop Loss` },
          { value: 'cancelled_sl', label: t`Cancelled Stop Loss` },
          { value: 'failed_sl', label: t`Failed Stop Loss` },
        ],
      },
      {
        value: 'liquidated',
        label: t`Liquidated`,
      },
    ];

    return {
      label: t`Action`,
      value,
      selectedCount: getHistoryActionSelectedCount(value),
      options,
      onValueChange: (nextValue?: string) => {
        setFilterState(ORDER_TAB_VALUE.HISTORY, (filters) => {
          const nextFilters = filters.filter(
            (filter) => filter.id !== 'action',
          );
          return nextValue
            ? [...nextFilters, { id: 'action', value: nextValue }]
            : nextFilters;
        });
      },
    };
  }, [setFilterState, t, value]);
};
