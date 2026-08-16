import { FC, memo, useEffect, useRef } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import {
  useGlobalStore as useCommonGlobalStore,
  usePositions,
  usePriceTickerStream,
  useInstStore,
  useMarketConfigs,
  getCachedPriceTickerData,
  getCreditAwareUsdPriceSymbol,
  CREDIT_MARKET_CATEGORY,
  Position,
  useMarketValues,
  usePositionConstants,
} from '@/common';

import { DARK_COLOR_UP_DOWN } from '@/constants/trade';
import type { IPositionLineAdapter } from '@/lib/charting_library/charting_library';
import {
  getCachedMarketExecutionPrice,
  getCachedPriceTickerExecutionPrice,
  getPriceTickerExecutionPrice,
} from '@/lib/trade/executionPrice';
import { calcLiqPxByPosition } from '@/lib/trade/formulas';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { useKlineStore } from '@/stores/trade/kline';
import { themeObj } from './overrides';

// draw position line
const DrawPositionLine: FC = () => {
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const coins = useInstStore((state) => state.getCoins());
  const [tvWidget, showPositions] = useKlineStore(
    useShallow((state) => [state.tvWidget, state.showPositions]),
  );
  const { data: priceData } = usePriceTickerStream(inst?.symbol);
  const { data: positions = [] } = usePositions();
  const { data: marketConfig } = useMarketConfigs(inst);
  const { data: marketValues } = useMarketValues(inst);
  const { data: positionConstants } = usePositionConstants();

  const positionLines = useRef<
    Record<string, [IPositionLineAdapter, Position]>
  >({});
  const liqLines = useRef<
    Record<string, [IPositionLineAdapter, string, Position]>
  >({});

  const themeColors = themeObj;
  const color_up_down = DARK_COLOR_UP_DOWN;

  // remove position line when unmount
  useEffect(() => {
    return () => {
      Object.keys(positionLines.current).forEach((id) => {
        positionLines.current[id]![0].remove();
      });
      positionLines.current = {};

      Object.keys(liqLines.current).forEach((id) => {
        liqLines.current[id]![0].remove();
      });
      liqLines.current = {};
    };
  }, [tvWidget]);

  // draw position line
  useEffect(() => {
    if (tvWidget && instId) {
      tvWidget.onChartReady(() => {
        const updateOrAddPositions = showPositions
          ? positions.filter(
              (v) => v.marketAddress === inst?.marketTokenAddress,
            )
          : [];

        // delete position line
        const deletePositionIds = Object.keys(positionLines.current).filter(
          (id) =>
            !updateOrAddPositions.length ||
            updateOrAddPositions.every((v) => v.id !== id),
        );

        deletePositionIds.forEach((id) => {
          positionLines.current[id]?.[0].remove();
          liqLines.current[id]?.[0].remove();
          delete positionLines.current[id];
          delete liqLines.current[id];
        });

        // update or create position line
        updateOrAddPositions.forEach((position) => {
          const { id, entryPrice, isLong, sizeInUsd, collateralTokenAddress } =
            position;
          const collateralToken = coins[collateralTokenAddress];

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
                  truncateFormat(sizeInUsd, usdAmountDisplayDecimal, {
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

          let isNewCreated = false;
          if (!liqLines.current[id]) {
            try {
              const liqLine = tvWidget.activeChart().createPositionLine();
              liqLines.current[id] = [liqLine, '', position];
              isNewCreated = true;
            } catch {
              /** create liq line error */
            }
          }
          if (liqLines.current[id]) {
            const liqLine = liqLines.current[id][0];
            const liqPx = calcLiqPxByPosition({
              position,
              collateralTokenPx: getCachedPriceTickerExecutionPrice(
                getCreditAwareUsdPriceSymbol({
                  isCreditMarket:
                    position.isCreditMarket ||
                    inst?.category === CREDIT_MARKET_CATEGORY,
                  tokenSymbol: collateralToken?.symbol,
                }),
                { isIncrease: false, isLong, priceType: 'min' },
              ),
              indexTokenPx:
                getCachedMarketExecutionPrice({
                  symbol: inst?.symbol,
                  indexTokenAddress: inst?.indexTokenAddress,
                  isIncrease: false,
                  isLong,
                }) || getCachedPriceTickerData(inst?.symbol)?.[0]?.p,
              indexTokenDecimals: inst?.indexTokenAddress
                ? coins[inst.indexTokenAddress]?.decimals
                : undefined,
              marketConfigs: marketConfig,
              marketValues,
              minCollateralUsd: positionConstants?.minCollateralUsd,
            }).toFixed();

            liqLines.current[id][1] = liqPx;
            if (!liqPx) {
              liqLine.remove();
              delete liqLines.current[id];
            } else {
              if (isNewCreated) {
                liqLine
                  .setLineLength(65, 'pixel')
                  .setText(
                    isLong ? i18n._(msg`Liq Long`) : i18n._(msg`Liq Short`),
                  )
                  .setPrice(+liqPx)
                  .setLineStyle(1)
                  .setQuantity('')
                  .setBodyTextColor(themeColors.lineTextColor)
                  .setBodyBorderColor(themeColors.liqLineColor)
                  .setBodyBackgroundColor(themeColors.liqLineColor)
                  .setLineColor(themeColors.liqLineColor);
              } else {
                liqLine.setPrice(+liqPx);
              }
            }
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
    inst,
    instId,
    coins,
    marketConfig,
    marketValues,
    positionConstants,
  ]);

  // update pnl and color when price change
  useEffect(() => {
    Object.keys(positionLines.current).forEach((id) => {
      if (priceData[0]?.p) {
        const { entryPrice, sizeInUsd, isLong } = positionLines.current[id]![1];
        const marketPx = getPriceTickerExecutionPrice(priceData[0], {
          isIncrease: false,
          isLong,
        });
        if (!marketPx) return;

        const pnlBN = calc(sizeInUsd)
          .div(entryPrice)
          .times(marketPx)
          .minus(sizeInUsd)
          .times(isLong ? 1 : -1);
        const pnl = truncateFormat(pnlBN, usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
          signDisplay: 'always',
        });

        positionLines.current[id]![0].setText(`PnL: ${pnl}`).setBodyTextColor(
          color_up_down[!isLong ? 1 : 0] as string,
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
            .setBodyTextColor(themeColors.lineTextColor)
            .setLineColor(themeColors.warningColor)
            .setBodyBackgroundColor(themeColors.warningColor)
            .setBodyBorderColor(themeColors.warningColor);
        } else {
          liqLine
            .setBodyTextColor(themeColors.lineTextColor)
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
    themeColors.lineTextColor,
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
