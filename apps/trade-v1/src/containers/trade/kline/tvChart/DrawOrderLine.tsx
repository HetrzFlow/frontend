import { FC, memo, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { toast } from '@repo/ui';
import type { Order } from '@/common';
import {
  useGlobalStore as useCommonGlobalStore,
  useCancelOrder,
  useOpenOrders,
  getCachedPriceTickerData,
  useInstStore,
} from '@/common';
import EditOrderPriceDialog from '@/components/EditOrderPriceDialog';
import { useOnEditOrderPrice } from '@/components/EditOrderPriceDialog/hooks';
import { COLOR_UP_DOWN, DARK_COLOR_UP_DOWN } from '@/constants/common';
import type { IOrderLineAdapter } from '@/lib/charting_library/charting_library';
import { useGlobalStore } from '@/stores/trade/global';
import { useKlineStore } from '@/stores/trade/kline';
import { themeObj } from './overrides';

// exec transaction of modify order
const modifyOrder = async ({
  order,
  marketPx,
  targetPx,
  pxDispDecimal,
  openEditDialog,
}: {
  order: Order;
  marketPx?: string;
  targetPx: string | number;
  pxDispDecimal?: number;
  openEditDialog: (
    orderId: string,
    options: {
      initialValues?: { price?: string };
      callback?: ((modified?: boolean) => void) | undefined;
    },
  ) => void;
}) => {
  const { isBuy } = order;
  if (marketPx) {
    if (isBuy) {
      const maxPx = calc(marketPx).times(1.1);
      if (calc(targetPx).gt(maxPx)) {
        const dispMaxPrice = truncateFormat(maxPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
          stripTrailingZeros: true,
        });
        toast.error(i18n._(msg`Above Max Limit Price: ${dispMaxPrice}`));
        return false;
      }
    } else {
      const minPx = calc(marketPx).times(0.9);
      if (calc(targetPx).lt(minPx)) {
        const dispMinPrice = truncateFormat(minPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
          stripTrailingZeros: true,
        });
        toast.error(i18n._(msg`Below Min Limit Price: ${dispMinPrice}`));
        return false;
      }
    }
  }

  // modify order
  return await new Promise((resolve) => {
    openEditDialog(order.orderId, {
      initialValues: {
        price: `${targetPx}`,
      },
      callback: (modified) => {
        resolve(modified);
      },
    });
  });
};

// draw order line
const DrawOrderLine: FC = () => {
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const { resolvedTheme: theme } = useTheme();
  const [tvWidget, showPositions] = useKlineStore(
    useShallow((state) => [state.tvWidget, state.showPositions]),
  );
  const { data: orders, refetch } = useOpenOrders();
  const { mutate: onCancel } = useCancelOrder({
    refetchOrders: refetch,
  });

  const [curOrderId, setCurOrderId] = useState<string>();
  const {
    initialValues,
    onEditOrderPrice,
    dialogOpen: editPriceDialogOpen,
    setDialogOpen: setEditPriceDialogOpen,
  } = useOnEditOrderPrice({ setCurOrderId });

  const orderLines = useRef<Record<string, [IOrderLineAdapter, Order]>>({});

  const themeColors = theme === 'dark' ? themeObj.dark : themeObj.light;
  const color_up_down = theme === 'dark' ? DARK_COLOR_UP_DOWN : COLOR_UP_DOWN;

  // remove order line when unmount
  useEffect(() => {
    return () => {
      Object.keys(orderLines.current).forEach((id) => {
        orderLines.current[id]![0].remove();
      });
      orderLines.current = {};
    };
  }, [tvWidget]);

  // draw order line
  useEffect(() => {
    if (tvWidget && orders && instId) {
      tvWidget.onChartReady(() => {
        const updateOrAddPositions = showPositions
          ? orders
              .filter((v) => v.targetCoin === inst?.coinType)
              .sort((a, b) => a.timestamp - b.timestamp)
          : [];

        // delete order line
        const deletePositionIds = Object.keys(orderLines.current).filter((id) =>
          updateOrAddPositions.every((v) => v.orderId !== id),
        );

        deletePositionIds.forEach((id) => {
          orderLines.current[id]?.[0].remove();
          delete orderLines.current[id];
        });

        // update or create order line
        updateOrAddPositions.forEach((order) => {
          const {
            orderId: id,
            triggerPrice,
            isLong,
            isOpen,
            isBuy,
            size,
          } = order;
          if (orderLines.current[id]) {
            const orderLine = orderLines.current[id][0];
            orderLine.setPrice(+triggerPrice).onMove(async () => {
              const result = await modifyOrder({
                order: order,
                marketPx: getCachedPriceTickerData(inst?.id)?.[0]?.p,
                targetPx: orderLine.getPrice(),
                pxDispDecimal: coins[inst?.baseCoin || '']?.pxDispDecimal,
                openEditDialog: onEditOrderPrice,
              });

              if (!result) {
                orderLine.setPrice(+order.triggerPrice);
              }
            });
          } else {
            try {
              const orderLine = tvWidget.activeChart().createOrderLine();
              const color = color_up_down[isBuy ? 0 : 1] as string;

              orderLine
                .onCancel(() => {
                  onCancel([order]);
                })
                .onMove(async () => {
                  const result = await modifyOrder({
                    order: order,
                    marketPx: getCachedPriceTickerData(inst?.id)?.[0]?.p,
                    targetPx: orderLine.getPrice(),
                    pxDispDecimal: coins[inst?.baseCoin || '']?.pxDispDecimal,
                    openEditDialog: onEditOrderPrice,
                  });

                  if (!result) {
                    orderLine.setPrice(+order.triggerPrice);
                  }
                })
                .setLineLength(-65, 'pixel')
                .setModifyTooltip(i18n._(msg`Drag to modify order price`))
                .setPrice(+triggerPrice)
                .setLineColor(color)
                .setLineStyle(2)
                .setText(
                  `${i18n._(msg`Limit`)} ${isOpen ? i18n._(msg`Open`) : i18n._(msg`Close`)} ${isLong ? i18n._(msg`Long`) : i18n._(msg`Short`)}`,
                )
                .setBodyTextColor(color)
                .setBodyBackgroundColor(themeColors.positionLineBg)
                .setQuantity(
                  truncateFormat(size, usdAmountDisplayDecimal, {
                    style: 'currency',
                    currency: 'USD',
                  }),
                )
                .setCancelButtonIconColor(themeColors.positionLineCloseBtnColor)
                .setCancelButtonBackgroundColor(themeColors.positionLineBg)
                .setCancelButtonBorderColor(color)
                .setQuantityTextColor(color)
                .setQuantityBackgroundColor(themeColors.positionLineBg)
                .setQuantityBorderColor(color)
                .setBodyBorderColor(color);

              orderLines.current[id] = [orderLine, order];
            } catch {
              /** draw order line error */
            }
          }
        });
      });
    }
  }, [
    tvWidget,
    showPositions,
    orders,
    usdAmountDisplayDecimal,
    themeColors,
    color_up_down,
    instId,
    coins,
    inst,
    onCancel,
    onEditOrderPrice,
  ]);

  // update color when theme change
  useEffect(() => {
    Object.keys(orderLines.current).forEach((id) => {
      orderLines.current[id]![0].setCancelButtonIconColor(
        themeColors.positionLineCloseBtnColor,
      )
        .setQuantityBackgroundColor(themeColors.positionLineBg)
        .setBodyBackgroundColor(themeColors.positionLineBg)
        .setCancelButtonBackgroundColor(themeColors.positionLineBg);
    });
  }, [themeColors]);

  return (
    curOrderId && (
      <EditOrderPriceDialog
        orderId={curOrderId}
        initialValues={initialValues}
        open={editPriceDialogOpen}
        onOpenChange={setEditPriceDialogOpen}
      />
    )
  );
};

export default memo(DrawOrderLine);
