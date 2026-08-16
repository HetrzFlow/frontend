import { useMemo } from 'react';

import { useOpenOrders, type Order } from '@/common/services/rest/order';
import type { Position } from '@/common/services/rest/position';

/**
 * Filters open orders to get TP/SL orders for a specific position.
 */
export const usePositionOrders = (position: Position) => {
  const { data: allOrders, refetch } = useOpenOrders();

  const tpSlOrders = useMemo(() => {
    if (!allOrders) return [] as Order[];
    return allOrders.filter(
      (o: Order) =>
        o.marketAddress === position.marketAddress &&
        o.isLong === position.isLong &&
        o.isZFP === position.isZFP &&
        (o.isTp || o.isSl),
    );
  }, [allOrders, position.marketAddress, position.isLong, position.isZFP]);

  const tpOrders = useMemo(
    () => tpSlOrders.filter((o: Order) => o.isTp),
    [tpSlOrders],
  );

  const slOrders = useMemo(
    () => tpSlOrders.filter((o: Order) => o.isSl),
    [tpSlOrders],
  );

  return { tpSlOrders, tpOrders, slOrders, refetch };
};
