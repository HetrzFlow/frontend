import { FC, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { truncateFormat } from '@repo/lib/format';
import {
  useHzSdk,
  useGlobalStore as useCommonGlobalStore,
  useInstStore,
} from '@/common';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { DARK_COLOR_UP_DOWN } from '@/constants/trade';
import type {
  DrawingEventType,
  EntityId,
  IExecutionLineAdapter,
} from '@/lib/charting_library/charting_library';
import { useHistoryOrders, type HistoryOrder } from '@/services/rest/order';

import { useTradeGlobalStore } from '@/stores/trade/global';
import { useKlineStore } from '@/stores/trade/kline';
import { resolutionIntervalMap } from './const';

// draw history buy/sell point
const DrawHistoryPoint: FC = () => {
  const hzSdk = useHzSdk();
  const hzSdkRef = useRef(hzSdk);
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const [tvWidget, showPositions, interval] = useKlineStore(
    useShallow((state) => [
      state.tvWidget,
      state.showPositions,
      state.interval,
    ]),
  );
  const currentAccount = useCurrentAccountAddress();
  const { data: historyOrders } = useHistoryOrders({
    instId,
    userAddress: currentAccount,
    limit: 100,
  });

  const historyRecords: {
    price: number;
    count: number;
    side: string;
    timestamp: number;
  }[] = useMemo(() => {
    const barOrderMap: Record<string, HistoryOrder[]> = {};

    const intervalNum = resolutionIntervalMap[interval]!;
    const timezoneOffset =
      tvWidget?.activeChart().getTimezoneApi().getTimezone().offset || 0;
    historyOrders.forEach((v) => {
      const barTimestamp =
        Math.floor((v.action_time_ms - timezoneOffset) / 1000 / intervalNum) *
          intervalNum +
        timezoneOffset / 1000;
      if (barOrderMap[barTimestamp]) {
        barOrderMap[barTimestamp].push(v);
      } else {
        barOrderMap[barTimestamp] = [v];
      }
    });

    return Object.keys(barOrderMap).flatMap((barTimestamp) => {
      const buyOrder: HistoryOrder[] = [];
      const sellOrder: HistoryOrder[] = [];
      barOrderMap[barTimestamp]?.forEach((v) => {
        if (
          (v.is_long && v.action_type === 'increase') ||
          (!v.is_long && v.action_type !== 'increase')
        ) {
          buyOrder.push(v);
        } else {
          sellOrder.push(v);
        }
      });
      const results = [];
      if (buyOrder.length) {
        results.push({
          timestamp: +barTimestamp,
          count: buyOrder.length,
          side: 'buy',
          price:
            buyOrder.reduce((acc, cur) => acc + +cur.price, 0) /
            buyOrder.length,
        });
      }
      if (sellOrder.length) {
        results.push({
          timestamp: +barTimestamp,
          count: sellOrder.length,
          side: 'sell',
          price:
            sellOrder.reduce((acc, cur) => acc + +cur.price, 0) /
            sellOrder.length,
        });
      }
      return results;
    });
  }, [historyOrders, interval, tvWidget]);

  const recordPoints = useRef<
    Record<
      string,
      [
        IExecutionLineAdapter,
        {
          price: number;
          count: number;
          side: string;
          timestamp: number;
        },
      ]
    >
  >({});

  const color_up_down = DARK_COLOR_UP_DOWN;

  // remove position line when unmount
  useEffect(() => {
    const handleClick = (entityId: EntityId, eventType: DrawingEventType) => {
      if (eventType === 'click') {
        const recordPoint = Object.values(recordPoints.current).find(
          ([executionShape]) =>
            (
              executionShape as IExecutionLineAdapter & {
                _line: { _id: string };
              }
            )._line._id === entityId,
        );

        if (recordPoint) {
          // TODO: handle click
          hzSdkRef.current?.logger.info(recordPoint[1]);
        }
      }
    };

    tvWidget?.subscribe('drawing_event', handleClick);

    return () => {
      try {
        tvWidget?.unsubscribe('drawing_event', handleClick);
      } catch {
        /** */
      }
    };
  }, [tvWidget]);

  // draw position line
  useEffect(() => {
    if (tvWidget && historyRecords) {
      const createExecutionShape = () => {
        Object.values(recordPoints.current).forEach(([executionShape]) => {
          executionShape.remove();
        });
        recordPoints.current = {};
        const createRecords = showPositions ? historyRecords : [];
        createRecords.forEach((record) => {
          const { price, count, side, timestamp } = record;
          if (recordPoints.current[`${timestamp}_${side}`]) {
            return;
          }
          // const isBuy = side === 'buy';
          const dispPrice = truncateFormat(price, usdAmountDisplayDecimal, {
            stripTrailingZeros: true,
          });
          const executionShape = tvWidget.activeChart().createExecutionShape();
          // const color = color_up_down[isBuy ? 0 : 1] as string;
          executionShape
            // .setText(`@${price} ${side} ${count}`)
            .setTooltip(`@${dispPrice} ${side} ${count}`)
            // .setTextColor(color)
            // .setArrowColor(color)
            .setArrowHeight(10)
            .setDirection(side === 'buy' ? 'buy' : 'sell')
            .setTime(timestamp)
            .setPrice(+price);
          recordPoints.current[`${timestamp}_${side}`] = [
            executionShape,
            record,
          ];
        });
      };

      tvWidget.onChartReady(() => {
        try {
          createExecutionShape();
        } catch {
          /** draw record point error */
        }
      });
    }

    return () => {
      Object.values(recordPoints.current).forEach(([executionShape]) => {
        executionShape.remove();
      });
      recordPoints.current = {};
    };
  }, [
    tvWidget,
    showPositions,
    historyRecords,
    usdAmountDisplayDecimal,
    inst?.indexTokenAddress,
    instId,
    hzSdk,
  ]);

  // update color when theme change
  useEffect(() => {
    Object.values(recordPoints.current).forEach(
      ([executionShape, historyRecord]) => {
        const color = color_up_down[
          historyRecord.side === 'buy' ? 0 : 1
        ] as string;
        executionShape.setTextColor(color).setArrowColor(color);
      },
    );
  }, [color_up_down]);

  return null;
};

export default DrawHistoryPoint;
