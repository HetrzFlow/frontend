import { FC, useEffect, useRef, useState } from 'react';
import { OrderType } from '@hertzflow/sdk-v2/types/orders';
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
  useInstStore,
  useMarketConfigs,
} from '@/common';
import EditOrderPriceDialog from '@/components/EditOrderPriceDialog';
import { useOnEditOrderPrice } from '@/components/EditOrderPriceDialog/hooks';
import { DARK_COLOR_UP_DOWN } from '@/constants/trade';
import { marketIsOpen as marketIsOpenFn } from '@/hooks/useMarketsStats';
import type { IOrderLineAdapter } from '@/lib/charting_library/charting_library';
import { getCachedMarketExecutionPrice } from '@/lib/trade/executionPrice';
import { useTradeGlobalStore } from '@/stores/trade/global';
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
  const { orderType, isLong } = order;
  if (marketPx) {
    if (
      (isLong && orderType === OrderType.LimitIncrease) ||
      (isLong && orderType === OrderType.StopLossDecrease) ||
      (!isLong && orderType === OrderType.LimitDecrease)
    ) {
      const maxPx = calc(marketPx);
      if (calc(targetPx).gt(maxPx)) {
        const dispMaxPrice = truncateFormat(maxPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
          stripTrailingZeros: true,
        });
        toast.error(i18n._(msg`Above Max Price: ${dispMaxPrice}`));
        return false;
      }
    } else if (
      (!isLong && orderType === OrderType.LimitIncrease) ||
      (!isLong && orderType === OrderType.StopLossDecrease) ||
      (isLong && orderType === OrderType.LimitDecrease)
    ) {
      const minPx = calc(marketPx);
      if (calc(targetPx).lt(minPx)) {
        const dispMinPrice = truncateFormat(minPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
          stripTrailingZeros: true,
        });
        toast.error(i18n._(msg`Below Min Price: ${dispMinPrice}`));
        return false;
      }
    }
  }

  // modify order
  return await new Promise((resolve) => {
    openEditDialog(order.id, {
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
  const instId = useTradeGlobalStore((state) => state.instId);
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId];
  const { data: marketConfig } = useMarketConfigs(inst);
  const [tvWidget, showPositions] = useKlineStore(
    useShallow((state) => [state.tvWidget, state.showPositions]),
  );
  const { data: orders = [], refetch } = useOpenOrders();
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

  const themeColors = themeObj;
  const color_up_down = DARK_COLOR_UP_DOWN;

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
    if (tvWidget && instId) {
      tvWidget.onChartReady(() => {
        const updateOrAddPositions = showPositions
          ? orders
              .filter((v) => v.marketAddress === inst?.marketTokenAddress)
              .sort((a, b) => a.timestamp - b.timestamp)
          : [];

        // delete order line
        const deletePositionIds = Object.keys(orderLines.current).filter(
          (id) =>
            !updateOrAddPositions.length ||
            updateOrAddPositions.every((v) => v.id !== id),
        );

        deletePositionIds.forEach((id) => {
          orderLines.current[id]?.[0].remove();
          delete orderLines.current[id];
        });

        // update or create order line
        updateOrAddPositions.forEach((order) => {
          const {
            id,
            triggerPrice,
            isLong,
            sizeDeltaUsd,
            orderType,
          } = order;
          const isIncrease = orderType === OrderType.LimitIncrease;
          const marketIsOpen = marketIsOpenFn(inst);
          const marketIsDisabled = marketConfig?.isDisabled;
          if (orderLines.current[id]) {
            const orderLine = orderLines.current[id][0];
            orderLine.setPrice(+triggerPrice).onMove(async () => {
              if (!marketIsOpen || marketIsDisabled) {
                orderLine.setPrice(+order.triggerPrice);
                return;
              }

              const result = await modifyOrder({
                order: order,
                marketPx: getCachedMarketExecutionPrice({
                  symbol: inst?.symbol,
                  indexTokenAddress: inst?.indexTokenAddress,
                  isIncrease,
                  isLong,
                }),
                targetPx: orderLine.getPrice(),
                pxDispDecimal: inst?.pxDispDecimal,
                openEditDialog: onEditOrderPrice,
              });

              if (!result) {
                orderLine.setPrice(+order.triggerPrice);
              }
            });
          } else {
            try {
              const orderLine = tvWidget.activeChart().createOrderLine();
              const color = color_up_down[isLong ? 0 : 1] as string;
              const orderTypeText =
                order.orderType === OrderType.LimitIncrease
                  ? i18n._(msg`Limit`)
                  : order.orderType === OrderType.LimitDecrease
                    ? i18n._(msg`Take Profit`)
                    : order.orderType === OrderType.StopLossDecrease
                      ? i18n._(msg`Stop Loss`)
                      : '';

              orderLine
                .onCancel(() => {
                  onCancel([order]);
                })
                .onMove(async () => {
                  if (!marketIsOpen || marketIsDisabled) {
                    orderLine.setPrice(+order.triggerPrice);
                    return;
                  }
                  const result = await modifyOrder({
                    order: order,
                    marketPx: getCachedMarketExecutionPrice({
                      symbol: inst?.symbol,
                      indexTokenAddress: inst?.indexTokenAddress,
                      isIncrease,
                      isLong,
                    }),
                    targetPx: orderLine.getPrice(),
                    pxDispDecimal: inst?.pxDispDecimal,
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
                .setText(`${orderTypeText}`)
                .setBodyTextColor(color)
                .setBodyBackgroundColor(themeColors.positionLineBg)
                .setQuantity(
                  truncateFormat(sizeDeltaUsd, usdAmountDisplayDecimal, {
                    style: 'currency',
                    currency: 'USD',
                    signDisplay: 'always',
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
    inst,
    onCancel,
    onEditOrderPrice,
    marketConfig,
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
        order={orders?.find((v) => v.id === curOrderId)}
        initialValues={initialValues}
        open={editPriceDialogOpen}
        onOpenChange={setEditPriceDialogOpen}
      />
    )
  );
};

export default DrawOrderLine;
