import { useEffect } from 'react';
import type { IChartingLibraryWidget } from '@/lib/charting_library/charting_library';
import { useKlineStore } from '@/stores/trade/kline';

// switch interval
export const useIntervalChange = (tvWidget: IChartingLibraryWidget | null) => {
  const setKlineInterval = useKlineStore((state) => state.setKlineInterval);

  useEffect(() => {
    const activeChart = tvWidget?.activeChart();

    if (!activeChart) {
      return () => {};
    }

    // record interval
    activeChart.onIntervalChanged().subscribe(null, () => {
      setKlineInterval(activeChart.resolution());
    });

    return () => {
      // unsubscribe
      activeChart.onIntervalChanged().unsubscribeAll(null);
    };
  }, [tvWidget, setKlineInterval]);
};
