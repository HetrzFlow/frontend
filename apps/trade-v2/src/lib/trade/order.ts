import { OrderType } from '@hertzflow/sdk-v2/types/orders';
import { calc } from '@repo/lib/calc';
import { type Order } from '@/common';
import { getPositionModeKey } from './position';

type PositionModeLike = {
  marketAddress: string;
  isLong: boolean;
  isZFP?: boolean;
};

type TpSlOrderLike = PositionModeLike & {
  id: string;
  isTpSl: boolean;
};

export const getActivePositionModeKeys = (
  positions: PositionModeLike[] | undefined,
) =>
  new Set(
    (positions || []).map((position) =>
      getPositionModeKey({
        marketAddress: position.marketAddress,
        isLong: position.isLong,
        isZFP: position.isZFP,
      }),
    ),
  );

export const isTpSlOrderInactive = (
  order: TpSlOrderLike,
  activePositionModeKeys: Set<string>,
) =>
  order.isTpSl &&
  !activePositionModeKeys.has(
    getPositionModeKey({
      marketAddress: order.marketAddress,
      isLong: order.isLong,
      isZFP: order.isZFP,
    }),
  );

export const getInactiveTpSlOrderIds = <T extends TpSlOrderLike>(
  orders: T[] | undefined,
  positions: PositionModeLike[] | undefined,
): Set<string> => {
  // Skip the inactive check while positions are still loading.
  // Treating "not loaded" as "no active positions" would flag every TP/SL
  // order as inactive on entry, then unflag them once positions arrive.
  if (positions === undefined) return new Set();

  const activePositionModeKeys = getActivePositionModeKeys(positions);

  return new Set(
    (orders || [])
      .filter((order) => isTpSlOrderInactive(order, activePositionModeKeys))
      .map((order) => order.id),
  );
};

export const hasInactiveTpSlOrders = (
  orders: TpSlOrderLike[] | undefined,
  positions: PositionModeLike[] | undefined,
) => {
  return getInactiveTpSlOrderIds(orders, positions).size > 0;
};

export const findFirstLimitIncreaseOrder = ({
  orders,
  isLong,
  marketAddress,
  isZFP,
}: {
  orders: Order[];
  isLong: boolean;
  marketAddress: string;
  isZFP?: boolean;
}) => {
  let order: Order | undefined;

  orders.forEach((v) => {
    if (
      v.orderType === OrderType.LimitIncrease &&
      v.isLong === isLong &&
      v.marketAddress === marketAddress &&
      (isZFP === undefined || v.isZFP === isZFP)
    ) {
      if (!order) {
        order = v;
      } else if (
        (isLong && calc(v.triggerPrice).gt(order.triggerPrice)) ||
        (!isLong && calc(v.triggerPrice).lt(order.triggerPrice))
      ) {
        order = v;
      }
    }
  });

  return order;
};

// find first trigger tp and sl order
export const findFirstTriggerTpAndSlOrder = ({
  orders,
  isLong,
  marketAddress,
  isZFP,
}: {
  orders: Order[];
  isLong: boolean;
  marketAddress: string;
  isZFP?: boolean;
}) => {
  let tpOrder: Order | undefined;
  let slOrder: Order | undefined;

  orders.forEach((v) => {
    if (
      v.isLong === isLong &&
      v.marketAddress === marketAddress &&
      (isZFP === undefined || v.isZFP === isZFP)
    ) {
      if (v.isTp) {
        if (!tpOrder) {
          tpOrder = v;
        } else if (
          isLong
            ? calc(v.triggerPrice).lt(tpOrder.triggerPrice)
            : calc(v.triggerPrice).gt(tpOrder.triggerPrice)
        ) {
          tpOrder = v;
        }
      } else if (v.isSl) {
        if (!slOrder) {
          slOrder = v;
        } else if (
          isLong
            ? calc(v.triggerPrice).gt(slOrder.triggerPrice)
            : calc(v.triggerPrice).lt(slOrder.triggerPrice)
        ) {
          slOrder = v;
        }
      }
    }
  });

  return { tpOrder, slOrder };
};

/**
 * Find TP/SL orders nearest to mark price, with counts.
 * Display_TP = arg min |tp.triggerPrice - markPrice| over all TP orders
 * Display_SL = arg min |sl.triggerPrice - markPrice| over all SL orders
 */
export function findNearestTpAndSlOrder(
  orders: Order[],
  position: { marketAddress: string; isLong: boolean; isZFP?: boolean },
  markPrice: string,
): {
  tpOrder?: Order;
  slOrder?: Order;
  tpCount: number;
  slCount: number;
  tpOrders: Order[];
  slOrders: Order[];
} {
  const positionOrders = orders.filter(
    (o) =>
      o.marketAddress === position.marketAddress &&
      o.isLong === position.isLong &&
      (position.isZFP === undefined || o.isZFP === position.isZFP),
  );

  const tpOrders = positionOrders.filter((o) => o.isTp);
  const slOrders = positionOrders.filter((o) => o.isSl);

  const findNearest = (arr: Order[]) => {
    if (arr.length === 0) return undefined;
    return arr.reduce((nearest, o) => {
      const currentAbs = calc(o.triggerPrice).minus(markPrice).abs();
      const nearestAbs = calc(nearest.triggerPrice).minus(markPrice).abs();
      return currentAbs.lt(nearestAbs) ? o : nearest;
    });
  };

  return {
    tpOrder: findNearest(tpOrders),
    slOrder: findNearest(slOrders),
    tpCount: tpOrders.length,
    slCount: slOrders.length,
    tpOrders,
    slOrders,
  };
}
