import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferenceStore {
  slippage: string;
  setSlippage: (slippage: string) => void;
}

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set) => ({
      slippage: '0.02',
      setSlippage: (slippage) => set({ slippage }),
    }),
    {
      name: 'v1-hzlp.preferenceStore',
      partialize: ({ slippage }) => ({
        slippage,
      }),
    },
  ),
);
