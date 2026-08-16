import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  IChartingLibraryWidget,
  ResolutionString,
} from '@/lib/charting_library/charting_library';

export type KlineState = {
  tvWidget: null | IChartingLibraryWidget;
  showPositions: boolean;
  interval: ResolutionString;
  favoriteIntervals: ResolutionString[];
  timeAxisScale: number;
  dataIsFetching: boolean;
};

interface KlineStore extends KlineState {
  setTvWidget: (tvWidget: IChartingLibraryWidget | null) => void;
  setShowPositions: (show: boolean) => void;
  setKlineInterval: (interval: ResolutionString) => void;
  setTimeAxisScale: (timeAxisScale: number) => void;
  setState: (state: Partial<KlineState>) => void;
}

type PersistedStateType = {
  showPositions: boolean;
  interval: string;
  timeAxisScale: number;
};

export const DEFAULT_TIME_AXIS_SCALE = 1.5;

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
      timeAxisScale: DEFAULT_TIME_AXIS_SCALE,
      dataIsFetching: false,
      setTvWidget: (tvWidget) => set({ tvWidget }),
      setShowPositions: (show) => set({ showPositions: show }),
      setKlineInterval: (interval) => set({ interval }),
      setTimeAxisScale: (timeAxisScale) => set({ timeAxisScale }),
      setState: (state) => set(state),
    }),
    {
      name: 'v2-trade.klineStore', // localStorage key
      partialize: ({ showPositions, interval, timeAxisScale }) => ({
        showPositions,
        interval,
        timeAxisScale,
      }),
    },
  ),
);
