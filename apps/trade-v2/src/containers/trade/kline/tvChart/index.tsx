import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { dateFormat, truncateFormat } from '@repo/lib/format';
import { useMediaQuery, MEDIA_SIZES, cn } from '@repo/ui';
import {
  useHzSdk,
  isDebugMode,
  useGlobalStore as useCommonGlobalStore,
  useInstStore,
} from '@/common';

import { useMarketIsOpen } from '@/hooks/useMarketsStats';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import type {
  CustomFormatters,
  IChartingLibraryWidget,
  PlusClickParams,
  ThemeName,
} from '@/lib/charting_library/charting_library';
import { useTradeGlobalStore } from '@/stores/trade/global';

import { useKlineStore } from '@/stores/trade/kline';

import ChartLimitOrderMenuController, {
  type ChartLimitOrderMenuControllerHandle,
} from './ChartLimitOrderMenuController';
import { supportedResolutions } from './const';
import { createDatafeed } from './datafeed';
// import DrawHistoryPoint from './DrawHistoryPoint';
import DrawOrderLine from './DrawOrderLine';
import DrawPositionLine from './DrawPositionLine';
import { useIntervalChange } from './hooks/useIntervalChange';
import { useNetworkReconnect } from './hooks/useNetworkReconnect';
import {
  getOverrides,
  setCSSCustomProperties,
  studiesOverrides,
} from './overrides';

const chartingLibraryPromise = import(
  /* webpackChunkName: "charting_library" */
  '@/lib/charting_library/charting_library.esm.js'
);

const TRADING_VIEW_LOCALES: Record<string, TradingView.LanguageCode> = {
  'zh-Hans': 'zh',
  'zh-Hant': 'zh_TW',
};

const TvChart: FC = () => {
  const mediaSz = useMediaQuery();
  const isMobile = mediaSz === MEDIA_SIZES.SM;
  const hzSdk = useHzSdk();
  const isGreenUp = useCommonGlobalStore((state) => state.isGreenUp);
  const insts = useInstStore((state) => state.getInsts());
  const [
    interval,
    favoriteIntervals,
    timeAxisScale,
    dataIsFetching,
    setTimeAxisScale,
    setTvWidgetInStore,
  ] = useKlineStore(
    useShallow((state) => [
      state.interval,
      state.favoriteIntervals,
      state.timeAxisScale,
      state.dataIsFetching,
      state.setTimeAxisScale,
      state.setTvWidget,
    ]),
  );
  const [tvWidget, setTvWidget] = useState<IChartingLibraryWidget | null>(null);

  const tvContainer = useRef<HTMLDivElement>(null);
  const limitOrderMenuControllerRef =
    useRef<ChartLimitOrderMenuControllerHandle>(null);
  const instId = useTradeGlobalStore((state) => state.instId);
  const {
    i18n: { locale },
  } = useLingui();
  const tradingViewLocale = TRADING_VIEW_LOCALES[locale] ?? 'en';
  const [redrawLine, setRedrawLines] = useState(0);
  const [refreshChartFlag, setRefreshChartFlag] = useState(0);
  const theme = 'dark' as ThemeName;
  const overrides = useMemo(
    () => getOverrides({ isGreenUp, isMobile }),
    [isGreenUp, isMobile],
  );
  const instBySymbol = useMemo(() => {
    const map = new Map<string, (typeof insts)[string]>();

    Object.values(insts).forEach((inst) => {
      map.set(inst.symbol, inst);
    });

    return map;
  }, [insts]);
  const canInitChart = Object.keys(insts).length > 0;

  useEffect(() => {
    if (!canInitChart) {
      return;
    }

    let disposed = false;
    let widgetRemoved = false;
    let _tvWidget: IChartingLibraryWidget | null = null;
    const removeWidget = () => {
      if (widgetRemoved) return;
      widgetRemoved = true;
      limitOrderMenuControllerRef.current?.close();
      _tvWidget?.remove();
    };
    // record listeners for remove them later
    const subObj = {};
    chartingLibraryPromise.then(({ widget }) => {
      if (disposed || !tvContainer.current) {
        return;
      }

      const createdWidget = new widget({
        debug: isDebugMode(), // uncomment this line to see Library errors and warnings in the console
        symbol: insts[instId]?.symbol || 'BTC/USD',
        // interval validation, default: 15min
        interval: supportedResolutions.includes(interval) ? interval : '15',
        container: tvContainer.current,
        datafeed: createDatafeed({ insts }),
        library_path: '/trade-static/charting_library/',
        custom_css_url: isMobile
          ? '/trade-static/charting_library/override-mobile.css?v=0'
          : '/trade-static/charting_library/override.css?v=0',
        locale: tradingViewLocale,
        autosize: true,
        disabled_features: [
          'header_symbol_search', // disabled search in header
          'header_compare', // disabled compare in header
          'display_market_status', // disabled market status
          'timeframes_toolbar', // disabled timeframes
          'popup_hints', // disabled popup hints
          // 'items_favoriting',
          'header_undo_redo', // disabled undo
          ...(isMobile
            ? [
                'header_fullscreen_button',
                'left_toolbar',
                'vert_touch_drag_scroll',
              ]
            : []), // disabled fullscreen button
        ],
        enabled_features: [
          // 'show_symbol_logos'
          'side_toolbar_in_fullscreen_mode', // fullscreen
          'request_only_visible_range_on_reset', // only request visible range data when reset
          'chart_crosshair_menu', // quick place order when click crosshair
          ...(isMobile
            ? [
                'iframe_loading_compatibility_mode',
                'hide_left_toolbar_by_default',
              ]
            : []), // support older browsers and a few non-standard browsers
        ],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        theme: theme,
        fullscreen: false,
        studies_overrides: studiesOverrides,
        overrides: overrides,
        favorites: {
          intervals: favoriteIntervals,
        },
        custom_formatters: {
          priceFormatterFactory: (symbolInfo?: { ticker?: string }) => {
            const inst = instBySymbol.get(symbolInfo?.ticker || '');
            const pxDispDecimal = inst?.pxDispDecimal ?? 2;
            return {
              format(price: string) {
                return truncateFormat(price, pxDispDecimal);
              },
            };
          },
          dateFormatter: {
            /** Formats date and time */
            format(date: Date) {
              const timezone = createdWidget
                .activeChart()
                .getTimezoneApi()
                .getTimezone();

              return dateFormat(
                date.valueOf() - (timezone.offset || 0),
                'EEE yyyy-MM-dd',
              );
            },
            /** Converts date and time to local timezone. */
            formatLocal(date: Date) {
              return dateFormat(date, 'HH:mm');
            },
          },
          // TODO: when upgrade tv, can delete this
        } as unknown as CustomFormatters,
      });
      _tvWidget = createdWidget;

      setCSSCustomProperties({
        tvWidget: createdWidget,
        isGreenUp,
        isMobile,
      });

      createdWidget.headerReady().then(() => {
        if (!disposed) {
          setTvWidget(createdWidget);
        }
      });
      // init completed
      createdWidget.onChartReady(() => {
        if (disposed) return;

        const onPlusClick = (params: PlusClickParams) => {
          limitOrderMenuControllerRef.current?.handlePlusClick(params);
        };
        const onMouseDown = () =>
          limitOrderMenuControllerRef.current?.close();
        createdWidget.subscribe('onPlusClick', onPlusClick);
        createdWidget.subscribe('mouse_down', onMouseDown);

        // tvWidget.activeChart().executeActionById();

        // set timescale
        createdWidget
          ?.activeChart()
          .getTimeScale()
          .setBarSpacing(6 * timeAxisScale);
        createdWidget
          ?.activeChart()
          .getTimeScale()
          .barSpacingChanged()
          .subscribe(subObj, (newBarSpacing: number) => {
            setTimeAxisScale(newBarSpacing / 6);
          });
      });
    });

    // update wrong data in localstorage
    try {
      // favorites -> intervals: if not use tv interval component, not need to handle this
      const _favoriteIntervals =
        JSON.parse(
          localStorage.getItem('tradingview.IntervalWidget.quicks') || 'null',
        ) || favoriteIntervals;
      if (_favoriteIntervals instanceof Array) {
        const validIntervals = _favoriteIntervals.filter((v) =>
          supportedResolutions.includes(v),
        );
        localStorage.setItem(
          'tradingview.IntervalWidget.quicks',
          JSON.stringify(validIntervals),
        );
      }
    } catch {
      /** ignore */
    }

    return () => {
      disposed = true;
      removeWidget();
      setTvWidget(null);
    };
    // listen refreshChartFlag to refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canInitChart, refreshChartFlag]);

  // remove tvWidget when unmount
  useEffect(() => {
    if (!tvWidget) {
      return () => {};
    }
    setTvWidgetInStore(tvWidget);

    return () => {
      setTvWidgetInStore(null);
    };
  }, [tvWidget, setTvWidgetInStore]);

  const refreshChart = useCallback(() => {
    setRefreshChartFlag(Date.now());
  }, []);

  // ws reconnect
  useNetworkReconnect(refreshChart);
  // when switch network, refresh
  useUpdateEffect(() => {
    if (hzSdk?.chainId) {
      refreshChart();
    }
  }, [hzSdk?.chainId, refreshChart]);

  // listen interval change
  useIntervalChange(tvWidget);

  // listen theme,isGreenUp change, update override
  useEffect(() => {
    if (!tvWidget) {
      return;
    }

    setCSSCustomProperties({ tvWidget, isGreenUp, isMobile });
    tvWidget?.applyOverrides(overrides);
    // should delay run, otherwise some override not work
    setTimeout(() => {
      tvWidget?.applyOverrides(overrides);
    }, 0);
  }, [isGreenUp, tvWidget, isMobile, overrides]);

  // listen instId to update symbol
  useEffect(() => {
    if (insts[instId]) {
      tvWidget?.activeChart()?.setSymbol(insts[instId].symbol, () => {
        // tvWidget.activeChart().
        // redraw position line, order line
        setRedrawLines((prev) => (prev + 1) % 10);
      });
    }
  }, [insts, instId, tvWidget]);

  const { data: isMarketOpen } = useMarketIsOpen(insts[instId]);

  return (
    <div
      className={cn(
        'relative h-full w-full max-md:h-[330px]',
        // set rounded-2xl for loading to prevent style issue
        tvWidget ? '[&_iframe]:rounded-none' : '[&_iframe]:rounded-2xl',
      )}
    >
      {/* {!tvWidget && <Loading className="bg-card absolute z-1 md:rounded-xl" />} */}
      <div
        ref={tvContainer}
        className={cn(
          'h-full w-full',
          dataIsFetching ? 'opacity-50' : '',
          isMarketOpen ? '' : 'opacity-40',
        )}
      />
      {tvWidget && <DrawPositionLine key={redrawLine} />}
      {tvWidget && <DrawOrderLine key={redrawLine + 1} />}
      <ChartLimitOrderMenuController
        ref={limitOrderMenuControllerRef}
        chartContainerRef={tvContainer}
      />
      {/* {tvWidget && <DrawHistoryPoint key={redrawLine + 2} />} */}
    </div>
  );
};

export default TvChart;
