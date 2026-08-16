import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY } from '@repo/lib/format';
import { ORDER_TYPE } from '@/common';

export const useOrderTypeText = (orderType: OrderType | ORDER_TYPE) => {
  const { t } = useLingui();

  switch (orderType) {
    case OrderType.LimitIncrease:
    case ORDER_TYPE.limit:
      return t`Limit`;
    case OrderType.MarketIncrease:
    case OrderType.MarketDecrease:
    case ORDER_TYPE.market:
      return t`Market Price`;
    case OrderType.StopIncrease:
      return t`Stop Market`;

    case OrderType.LimitDecrease:
    case ORDER_TYPE.take_profit:
      return t`Take Profit`;
    case OrderType.StopLossDecrease:
    case ORDER_TYPE.stop_loss:
      return t`Stop Loss`;
    case ORDER_TYPE.liquidated:
      return t`Liquidated`;
  }

  return EMPTY_DISPLAY;
};

export const useActionTypeText = (
  actionType: 'increase' | 'open' | 'decrease' | 'close' | 'liquidate' | '',
) => {
  const { t } = useLingui();

  switch (actionType) {
    case 'increase':
      return t`Increase`;
    case 'open':
      return t`Open`;
    case 'decrease':
      return t`Decrease`;
    case 'close':
      return t`Close`;
    case 'liquidate':
      return t`Liquidated`;
  }

  return EMPTY_DISPLAY;
};
