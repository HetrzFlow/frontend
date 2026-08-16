import { FC, memo, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import {
  useHzSdk,
  useGlobalStore as useCommonGlobalStore,
  getProtocolStoreDataFromCache,
  getVaultDataFromCache,
  usePositions,
  usePriceTickerStream,
  useInstStore,
} from '@/common';

import type { Position } from '@/common';
import { COLOR_UP_DOWN, DARK_COLOR_UP_DOWN } from '@/constants/common';
import type { IPositionLineAdapter } from '@/lib/charting_library/charting_library';
import { useGlobalStore } from '@/stores/trade/global';
import { useKlineStore } from '@/stores/trade/kline';
import { themeObj } from './overrides';

// draw position line
const DrawPositionLine: FC = () => {
  const hzSdk = useHzSdk();
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const { resolvedTheme: theme } = useTheme();
  const [tvWidget, showPositions] = useKlineStore(
    useShallow((state) => [state.tvWidget, state.showPositions]),
  );
  const { data: priceData } = usePriceTickerStream(instId);
  const { data: positions } = usePositions();

  const positionLines = useRef<
    Record<string, [IPositionLineAdapter, Position]>
  >({});
  const liqLines = useRef<
    Record<string, [IPositionLineAdapter, string, Position]>
  >({});

  const themeColors = theme === 'dark' ? themeObj.dark : themeObj.light;
  const color_up_down = theme === 'dark' ? DARK_COLOR_UP_DOWN : COLOR_UP_DOWN;

  // remove position line when unmount
  useEffect(() => {
    return () => {
      Object.keys(positionLines.current).forEach((id) => {
        positionLines.current[id]![0].remove();
      });
      positionLines.current = {};
    };
  }, [tvWidget]);

  // draw position line
  useEffect(() => {
    if (tvWidget && positions && instId) {
      tvWidget.onChartReady(() => {
        const updateOrAddPositions = showPositions
          ? positions.filter((v) => v.targetCoin === inst?.coinType)
          : [];

        // delete position line
        const deletePositionIds = Object.keys(positionLines.current).filter(
          (id) => updateOrAddPositions.every((v) => v.id !== id),
        );

        deletePositionIds.forEach((id) => {
          positionLines.current[id]?.[0].remove();
          liqLines.current[id]?.[0].remove();
          delete positionLines.current[id];
          delete liqLines.current[id];
        });

        // update or create position line
        updateOrAddPositions.forEach((position) => {
          const {
            id,
            entryPrice,
            isLong,
            size,
            entryFundingRate,
            collateral,
            collateralCoin,
          } = position;

          if (positionLines.current[id]) {
            positionLines.current[id][0].setPrice(+entryPrice);
          } else {
            try {
              const positionLine = tvWidget.activeChart().createPositionLine();
              const color = color_up_down[isLong ? 0 : 1] as string;

              positionLine
                // .onClose(() => {})
                .setLineLength(65, 'pixel')
                .setPrice(+entryPrice)
                .setCloseButtonIconColor(themeColors.positionLineCloseBtnColor)
                .setLineStyle(1)
                .setLineColor(color)
                .setText(`PnL: `)
                .setBodyTextColor(color_up_down[0] as string)
                .setBodyBackgroundColor(themeColors.positionLineBg)
                .setCloseButtonBackgroundColor(themeColors.positionLineBg)
                .setQuantity(
                  truncateFormat(size, usdAmountDisplayDecimal, {
                    style: 'currency',
                    currency: 'USD',
                  }),
                )
                .setQuantityBackgroundColor(color)
                .setQuantityBorderColor(color)
                .setQuantityTextColor(themeColors.lineTextColor)
                .setBodyBorderColor(color)
                .setCloseButtonBorderColor(color);

              positionLines.current[id] = [positionLine, position];
            } catch {
              /** draw postion line error */
            }
          }

          if (!liqLines.current[id]) {
            try {
              const liqLine = tvWidget.activeChart().createPositionLine();
              liqLines.current[id] = [liqLine, '', position];
            } catch {
              /** create liq line error */
            }
          }
          const liqLine = liqLines.current[id]![0];
          const protocolStore = getProtocolStoreDataFromCache(
            hzSdk.fullClient.network,
          );
          const vaultObject = getVaultDataFromCache(hzSdk.fullClient.network);
          let liqPx: string = '';
          if (protocolStore && vaultObject) {
            liqPx = hzSdk.QueryModule.calculateLiquidationPrice({
              realtimeConfig: hzSdk.QueryModule.getRealtimeConfig({
                collateralToken: collateralCoin,
                protocolStore,
                vaultObject,
              }),
              entryPrice: entryPrice,
              collateral: collateral,
              size: size,
              isLong,
              entryFundingRate,
              hasPosition: true,
            }).liquidationPriceFormatted;
          }
          liqLines.current[id]![1] = liqPx;
          if (!liqPx) {
            liqLine.remove();
            delete liqLines.current[id];
          } else {
            liqLine
              .setLineLength(65, 'pixel')
              .setText(isLong ? i18n._(msg`Liq Long`) : i18n._(msg`Liq Short`))
              .setPrice(+liqPx)
              .setLineStyle(1)
              .setQuantity('')
              .setBodyTextColor(themeColors.lineTextColor)
              .setBodyBorderColor(themeColors.liqLineColor)
              .setBodyBackgroundColor(themeColors.liqLineColor)
              .setLineColor(themeColors.liqLineColor);
          }
        });
      });
    }
  }, [
    tvWidget,
    showPositions,
    positions,
    usdAmountDisplayDecimal,
    themeColors,
    color_up_down,
    inst?.coinType,
    instId,
    hzSdk,
  ]);

  // update pnl and color when price change
  useEffect(() => {
    Object.keys(positionLines.current).forEach((id) => {
      if (priceData[0]?.p) {
        const { entryPrice, size, isLong } = positionLines.current[id]![1];
        const pnlBN = calc(size)
          .div(entryPrice)
          .times(priceData[0]?.p)
          .minus(size)
          .times(isLong ? 1 : -1);
        const pnl = truncateFormat(pnlBN, usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
          signDisplay: 'always',
        });

        positionLines.current[id]![0].setText(`PnL: ${pnl}`).setBodyTextColor(
          color_up_down[pnlBN.lt(0) ? 1 : 0] as string,
        );
      }
    });

    Object.keys(liqLines.current).forEach((id) => {
      const liqLine = liqLines.current[id]![0];
      const liqPx = liqLines.current[id]![1];
      if (priceData[0]?.p && liqPx) {
        const diff = calc(priceData[0].p).minus(liqPx).abs().div(liqPx);
        if (diff.lt(0.01)) {
          liqLine
            .setLineColor(themeColors.warningColor)
            .setBodyBackgroundColor(themeColors.warningColor)
            .setBodyBorderColor(themeColors.warningColor);
        } else {
          liqLine
            .setLineColor(themeColors.liqLineColor)
            .setBodyBackgroundColor(themeColors.liqLineColor)
            .setBodyBorderColor(themeColors.liqLineColor);
        }
      }
    });
  }, [
    priceData,
    usdAmountDisplayDecimal,
    themeColors.warningColor,
    themeColors.liqLineColor,
    color_up_down,
  ]);

  // update color when theme change
  useEffect(() => {
    Object.keys(positionLines.current).forEach((id) => {
      positionLines.current[id]![0].setCloseButtonIconColor(
        themeColors.positionLineCloseBtnColor,
      )
        .setBodyBackgroundColor(themeColors.positionLineBg)
        .setCloseButtonBackgroundColor(themeColors.positionLineBg)
        .setQuantityTextColor(themeColors.lineTextColor);
    });
  }, [themeColors]);

  return null;
};

export default memo(DrawPositionLine);
