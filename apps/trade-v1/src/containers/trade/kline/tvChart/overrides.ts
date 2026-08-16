import { COLOR_UP_DOWN, DARK_COLOR_UP_DOWN } from '@/constants/common';

import type {
  IChartingLibraryWidget,
  StudyOverrides,
  WidgetOverrides,
} from '@/lib/charting_library/charting_library';

export const studiesOverrides: StudyOverrides = {};

// theme configs
export const themeObj = {
  light: {
    bgColor: 'rgba(255,255,255,0)',
    smBgColor: '#f5f6f9',
    gridColor: 'rgba(88, 103, 149, 0.08)', // var(--border)
    scaleTextColor: 'rgba(0, 0, 0, 0.7)',
    positionLineBg: '#fff',
    positionLineCloseBtnColor: '#283040',
    activeColor: '#00c7d2', // var(--accent)
    activeForegroundColor: '#fff', // var(--accent-foreground)
    warningColor: '#ffbf00', //  var(--warning)
    liqLineColor: '#000',
    lineTextColor: '#fff',
    popverBgColor: '#fff',
    btnHoverBg: 'rgba(88, 103, 149, 0.1)',
  },
  dark: {
    bgColor: 'rgba(0,0,0,0)',
    smBgColor: 'rgba(0,0,0,0)',
    gridColor: 'rgba(191, 207, 255, 0.1)', // var(--border)
    scaleTextColor: 'rgba(255, 255, 255, 0.7)',
    positionLineBg: '#000', // '#283040',
    positionLineCloseBtnColor: '#fff',
    activeColor: '#00dfeb', // var(--accent)
    activeForegroundColor: '#000', // var(--accent-foreground)
    warningColor: '#ffbf00', //  var(--warning)
    liqLineColor: '#fff',
    lineTextColor: '#000',
    popverBgColor: '#1e1f22',
    btnHoverBg: 'rgba(179, 189, 217, 0.16)',
  },
};

export const getOverrides = ({
  isGreenUp,
  isDark,
  isMobile,
}: {
  isGreenUp: boolean;
  isDark: boolean;
  isMobile: boolean;
}): Partial<WidgetOverrides> => {
  const color_up_down = isDark ? DARK_COLOR_UP_DOWN : COLOR_UP_DOWN;
  const [upColor, downColor] = isGreenUp
    ? color_up_down
    : [color_up_down[1], color_up_down[0]];
  const { bgColor, gridColor, scaleTextColor, activeColor, smBgColor } = isDark
    ? themeObj.dark
    : themeObj.light;

  return {
    // background
    'paneProperties.backgroundType': 'solid',
    'paneProperties.background': isMobile ? smBgColor : bgColor,
    // grid
    'paneProperties.vertGridProperties.color': gridColor,
    'paneProperties.horzGridProperties.color': gridColor,

    // legend
    'paneProperties.legendProperties.showBackground': false,

    // pane separator
    'paneProperties.separatorColor': 'rgba(0,0,0,0)', // transparent

    // scales
    'scalesProperties.lineColor': 'rgba(0,0,0,0)', // transparent
    'scalesProperties.textColor': scaleTextColor,
    // 'scalesProperties.fontSize': 10,

    // price axis
    'mainSeriesProperties.priceAxisProperties.log': true,
    // 'scalesProperties.axisLineToolLabelBackgroundColorCommon': activeColor,

    'mainSeriesProperties.statusViewStyle.showExchange': false,

    // candle style
    'mainSeriesProperties.candleStyle.upColor': upColor,
    'mainSeriesProperties.candleStyle.downColor': downColor,
    'mainSeriesProperties.candleStyle.borderUpColor': upColor,
    'mainSeriesProperties.candleStyle.borderDownColor': downColor,
    // 'mainSeriesProperties.candleStyle.wickupColor': upColor,
    // 'mainSeriesProperties.candleStyle.wickdownColor': downColor,

    // hollow candle style
    'mainSeriesProperties.hollowCandleStyle.upColor': upColor,
    'mainSeriesProperties.hollowCandleStyle.downColor': downColor,
    'mainSeriesProperties.hollowCandleStyle.borderUpColor': upColor,
    'mainSeriesProperties.hollowCandleStyle.borderDownColor': downColor,
    // 'mainSeriesProperties.hollowCandleStyle.wickupColor': upColor,
    // 'mainSeriesProperties.hollowCandleStyle.wickdownColor': downColor,

    // ha style(heikin ashi)
    'mainSeriesProperties.haStyle.upColor': upColor,
    'mainSeriesProperties.haStyle.downColor': downColor,
    'mainSeriesProperties.haStyle.borderUpColor': upColor,
    'mainSeriesProperties.haStyle.borderDownColor': downColor,
    // 'mainSeriesProperties.haStyle.wickupColor': upColor,
    // 'mainSeriesProperties.haStyle.wickdownColor': downColor,

    // bar style
    'mainSeriesProperties.barStyle.upColor': upColor,
    'mainSeriesProperties.barStyle.downColor': downColor,

    // column style
    'mainSeriesProperties.columnStyle.upColor': upColor,
    'mainSeriesProperties.columnStyle.downColor': downColor,

    // line style

    // line with marker

    // step line

    // area

    // hlc area

    // baseline

    // high-low

    // position line
    // 'linetoolposition.bodyBackgroundColor': positionLineBg,
    // 'linetoolposition.closeButtonBackgroundColor': positionLineBg,
    // 'linetoolposition.closeButtonIconBuyColor': positionLineCloseBtnColor,
    // 'linetoolposition.closeButtonIconSellColor': positionLineCloseBtnColor,
    // 'linetoolposition.bodyTextPositiveColor': upColor,
    // 'linetoolposition.bodyTextNegativeColor': positionLineCloseBtnColor,
    // 'linetoolposition.bodyTextNeutralColor': upColor,

    // draw tool
    // 'linetooltrendline.linecolor': activeColor,
    // 'linetooltrendline.textcolor': activeColor,
  };
};

export const setCSSCustomProperties = ({
  tvWidget,
  isDark,
}: {
  tvWidget: IChartingLibraryWidget;
  isGreenUp: boolean;
  isDark: boolean;
}) => {
  const {
    bgColor,
    gridColor,
    activeColor,
    activeForegroundColor,
    popverBgColor,
    btnHoverBg,
  } = isDark ? themeObj.dark : themeObj.light;
  (
    [
      ['--tv-color-platform-background', bgColor],
      ['--tv-color-pane-background', bgColor],
      ['--tv-color-toolbar-divider-background', gridColor],
      ['--tv-color-toolbar-button-text-active', activeColor],
      ['--tv-color-toolbar-toggle-button-background-active-hover', activeColor],
      ['--tv-color-toolbar-toggle-button-background-active', activeColor],
      ['--tv-color-toolbar-button-text-active-hover', activeColor],
      ['--tv-color-popup-background', popverBgColor],
      ['--tv-color-toolbar-button-background-hover', btnHoverBg],
      ['--tv-color-popup-element-background-active', activeColor],
      ['--tv-color-popup-element-text-active', activeForegroundColor],
      // ['--ui-lib-button-color-bg', activeColor],
      // ['--ui-lib-button-color-border', activeColor],
      // ['--ui-lib-button-color-content', activeForegroundColor],
      // ['--ui-lib-checkbox-color-accent', activeColor],
      // ['--tv-color-toolbar-button-text-hover', ]
    ] as [string, string][]
  ).forEach((v) => {
    tvWidget.setCSSCustomProperty(v[0], v[1]);
  });
};
