import { useMemo } from 'react';
import { t } from '@lingui/core/macro';
import { ORDER_TAB_VALUE, ORDER_TYPE } from '@/constants/enum';

import { useOrdersStore } from '../store';

export const useOrderTypeFilter = () => {
  const orderFilterState = useOrdersStore((state) => state.orderFilterState);
  const setFilterState = useOrdersStore((state) => state.setFilterState);
  const value =
    (orderFilterState.find((filter) => filter.id === 'orderType')
      ?.value as string) || 'all';

  return useMemo(
    () => ({
      label: t`Type`,
      value,
      options: [
        {
          value: 'all',
          label: t`All`,
        },
        {
          value: ORDER_TYPE.limit,
          label: t`Limit`,
        },
        {
          value: ORDER_TYPE.take_profit,
          label: t`Take Profit`,
        },
        {
          value: ORDER_TYPE.stop_loss,
          label: t`Stop Loss`,
        },
      ],
      onValueChange: (nextValue: string) =>
        setFilterState(ORDER_TAB_VALUE.ORDER, [
          {
            id: 'orderType',
            value: nextValue,
          },
        ]),
    }),
    [setFilterState, value],
  );
};
