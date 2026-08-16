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

    const subscriptionOwner = {};

    // record interval
    activeChart.onIntervalChanged().subscribe(subscriptionOwner, () => {
      // after data loaded, set resolution
      activeChart.onDataLoaded().subscribe(
        subscriptionOwner,
        () => {
          setKlineInterval(activeChart.resolution());
        },
        true,
      );
    });

    return () => {
      // unsubscribe
      activeChart.onIntervalChanged().unsubscribeAll(subscriptionOwner);
      activeChart.onDataLoaded().unsubscribeAll(subscriptionOwner);
    };
  }, [tvWidget, setKlineInterval]);
};
