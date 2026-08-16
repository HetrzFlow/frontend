import { calc } from '@repo/lib/calc';

import type { Order } from '@/common/services/rest/order';
import type { Position } from '@/common/services/rest/position';

export const getEffectiveSizeDeltaUsd = (
  order: Pick<Order, 'sizeDeltaUsd'>,
) => {
  return calc(order.sizeDeltaUsd);
};

export const isPartialCloseOrder = (
  order: Pick<Order, 'sizeDeltaUsd'>,
  position: Pick<Position, 'sizeInUsd'>,
) => getEffectiveSizeDeltaUsd(order).abs().lt(position.sizeInUsd);
