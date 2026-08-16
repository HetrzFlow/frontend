import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  IChartingLibraryWidget,
  ResolutionString,
} from '@/lib/charting_library/charting_library';

interface KlineStore {
  tvWidget: null | IChartingLibraryWidget;
  showPositions: boolean;
  interval: ResolutionString;
  favoriteIntervals: ResolutionString[];
  timeAxisScale: number;
  setTvWidget: (tvWidget: IChartingLibraryWidget | null) => void;
  setShowPositions: (show: boolean) => void;
  setKlineInterval: (interval: ResolutionString) => void;
  setTimeAxisScale: (timeAxisScale: number) => void;
}

type PersistedStateType = {
  showPositions: boolean;
  interval: string;
  timeAxisScale: number;
};

export const useKlineStore = create<
  KlineStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set) => ({
      tvWidget: null,
      showPositions: true,
      // default 15min
      interval: '15' as ResolutionString,
      favoriteIntervals: [
        // '1',
        // '5',
        // '15',
        // '60',
        // '240',
        // '1D',
      ] as ResolutionString[],
      // time axis scale, default 1.5x
      timeAxisScale: 1.5,
      setTvWidget: (tvWidget) => set({ tvWidget }),
      setShowPositions: (show) => set({ showPositions: show }),
      setKlineInterval: (interval) => set({ interval }),
      setTimeAxisScale: (timeAxisScale) => set({ timeAxisScale }),
    }),
    {
      name: 'v1-trade.klineStore', // localStorage key
      partialize: ({ showPositions, interval, timeAxisScale }) => ({
        showPositions,
        interval,
        timeAxisScale,
      }),
    },
  ),
);
