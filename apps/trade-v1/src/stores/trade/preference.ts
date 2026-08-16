import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferenceStore {
  slippage: string;
  setSlippage: (slippage: string) => void;
}

type PersistedStateType = {
  slippage?: string;
};

export const usePreferenceStore = create<
  PreferenceStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set) => ({
      slippage: '0.02',
      setSlippage: (slippage) => set({ slippage }),
    }),
    {
      name: 'v1-trade.preferenceStore', // localStorage key
      partialize: ({ slippage }) => ({
        slippage,
      }),
    },
  ),
);
