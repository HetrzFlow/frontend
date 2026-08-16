import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';

import { useTheme } from 'next-themes';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { dateFormat, truncateFormat } from '@repo/lib/format';
import { useMediaQuery, MEDIA_SIZES, cn, Loading } from '@repo/ui';
import {
  useHzSdk,
  isDebugMode,
  useGlobalStore as useCommonGlobalStore,
  useInstStore,
} from '@/common';

import { useUpdateEffect } from '@/hooks/useUpdateEffect';
import type {
  CustomFormatters,
  IChartingLibraryWidget,
  ThemeName,
} from '@/lib/charting_library/charting_library';
import { useGlobalStore } from '@/stores/trade/global';

import { useKlineStore } from '@/stores/trade/kline';

import { supportedResolutions } from './const';
import { createDatafeed } from './datafeed';
import DrawOrderLine from './DrawOrderLine';
import DrawPositionLine from './DrawPositionLine';
import { useIntervalChange } from './hooks/useIntervalChange';
import { useNetworkReconnect } from './hooks/useNetworkReconnect';
import {
  getOverrides,
  setCSSCustomProperties,
  studiesOverrides,
} from './overrides';

const TvChart: FC = () => {
  const mediaSz = useMediaQuery();
  const isMobile = mediaSz === MEDIA_SIZES.SM;
  const hzSdk = useHzSdk();
  const isGreenUp = useCommonGlobalStore((state) => state.isGreenUp);
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const [
    interval,
    favoriteIntervals,
    timeAxisScale,
    setTimeAxisScale,
    setTvWidgetInStore,
  ] = useKlineStore(
    useShallow((state) => [
      state.interval,
      state.favoriteIntervals,
      state.timeAxisScale,
      state.setTimeAxisScale,
      state.setTvWidget,
    ]),
  );
  const [tvWidget, setTvWidget] = useState<IChartingLibraryWidget | null>(null);

  const tvContainer = useRef<HTMLDivElement>(null);
  const { resolvedTheme: theme } = useTheme();
  const instId = useGlobalStore((state) => state.instId);
  const {
    i18n: { locale },
  } = useLingui();
  const [redrawLine, setRedrawLines] = useState(0);
  const [refreshChartFlag, setRefreshChartFlag] = useState(0);

  useEffect(() => {
    let _tvWidget: IChartingLibraryWidget;
    // record listeners for remove them later
    const subObj = {};
    Promise.all([
      import(
        /* webpackChunkName: "charting_library" */
        /* webpackPreload: true */
        '@/lib/charting_library/charting_library.esm.js'
      ),
    ]).then(([{ widget }]) => {
      if (!tvContainer.current) {
        return;
      }

      _tvWidget = new widget({
        debug: isDebugMode(), // uncomment this line to see Library errors and warnings in the console
        symbol: instId,
        // interval validation, default: 15min
        interval: supportedResolutions.includes(interval) ? interval : '15',
        container: tvContainer.current,
        datafeed: createDatafeed({ insts, coins }),
        library_path: '/trade-static/charting_library/',
        custom_css_url: isMobile
          ? '/trade-static/charting_library/override-mobile.css?v=0'
          : '/trade-static/charting_library/override.css?v=0',
        locale: locale as TradingView.LanguageCode,
        autosize: true,
        disabled_features: [
          'header_symbol_search', // disabled search in header
          'header_compare', // disabled compare in header
          'display_market_status', // disabled market status
          'timeframes_toolbar', // disabled timeframes
          'popup_hints', // disabled popup hints
          // 'items_favoriting',
          'header_undo_redo', // disabled undo
          ...(isMobile ? ['header_fullscreen_button', 'left_toolbar'] : []), // disabled fullscreen button
        ],
        enabled_features: [
          // 'show_symbol_logos'
          'seconds_resolution', // support seconds resolution
          'side_toolbar_in_fullscreen_mode', // fullscreen
          'hide_left_toolbar_by_default', // default hidden draw toolbar
          'request_only_visible_range_on_reset', // only request visible range data when reset
        ],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        theme: theme,
        fullscreen: false,
        studies_overrides: studiesOverrides,
        overrides: getOverrides({
          isGreenUp,
          isDark: theme === 'dark',
          isMobile,
        }),
        favorites: {
          intervals: favoriteIntervals,
        },
        custom_formatters: {
          priceFormatterFactory: (symbolInfo: any) => {
            const pxDispDecimal =
              coins[insts[symbolInfo?.ticker]?.coinType || '']?.pxDispDecimal ??
              2;
            return {
              format(price: string) {
                return truncateFormat(price, pxDispDecimal);
              },
            };
          },
          dateFormatter: {
            /** Formats date and time */
            format(date: Date) {
              const timezone = _tvWidget
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

      setCSSCustomProperties({
        tvWidget: _tvWidget,
        isDark: theme === 'dark',
        isGreenUp,
      });
      // init completed
      _tvWidget.onChartReady(() => {
        setTvWidget(_tvWidget);
        // tvWidget.activeChart().executeActionById();

        // set timescale
        _tvWidget
          ?.activeChart()
          .getTimeScale()
          .setBarSpacing(6 * timeAxisScale);
        _tvWidget
          ?.activeChart()
          .getTimeScale()
          .barSpacingChanged()
          .subscribe(subObj, (newBarSpacing) => {
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
      setTvWidget(null);
    };
    // listen refreshChartFlag to refresh
  }, [refreshChartFlag]);

  // remove tvWidget when unmount
  useEffect(() => {
    if (!tvWidget) {
      return () => {};
    }
    setTvWidgetInStore(tvWidget);

    return () => {
      tvWidget.remove();
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
    refreshChart();
  }, [hzSdk.fullClient.network, refreshChart]);

  // listen interval change
  useIntervalChange(tvWidget);

  // listen theme,isGreenUp change, update override
  useEffect(() => {
    const isDark = theme === 'dark';
    if (tvWidget) {
      setCSSCustomProperties({ tvWidget: tvWidget, isDark, isGreenUp });
    }
    // changeTheme will clear override, so need run applyOverrides
    tvWidget?.changeTheme(theme as ThemeName, {
      disableUndo: true,
    });
    // run immediately to apply override
    tvWidget?.applyOverrides(getOverrides({ isGreenUp, isDark, isMobile }));
    // should delay run, otherwise some override not work
    setTimeout(() => {
      tvWidget?.applyOverrides(getOverrides({ isGreenUp, isDark, isMobile }));
    }, 0);
  }, [isGreenUp, theme, tvWidget, isMobile]);

  // listen instId to update symbol
  useEffect(() => {
    if (instId) {
      tvWidget?.activeChart()?.setSymbol(instId, () => {
        // redraw position line, order line
        setRedrawLines((prev) => (prev + 1) % 10);
      });
    }
  }, [instId, tvWidget]);

  return (
    <div
      className={cn(
        'relative h-full w-full max-md:h-[330px]',
        // set rounded-2xl for loading to prevent style issue
        tvWidget ? '[&_iframe]:rounded-none' : '[&_iframe]:rounded-2xl',
      )}
    >
      {!tvWidget && <Loading className="bg-bg-1 absolute md:rounded-xl" />}
      <div ref={tvContainer} className="h-full w-full" />
      {tvWidget && <DrawPositionLine key={redrawLine} />}
      {tvWidget && <DrawOrderLine key={redrawLine + 1} />}
    </div>
  );
};

export default memo(TvChart);
