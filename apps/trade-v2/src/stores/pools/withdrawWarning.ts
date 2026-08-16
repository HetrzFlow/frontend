import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WithdrawWarningState = {
  dismissed: boolean;
  setDismissed: (dismissed: boolean) => void;
};

export const useWithdrawWarningStore = create<
  WithdrawWarningState,
  [['zustand/persist', Pick<WithdrawWarningState, 'dismissed'>]]
>(
  persist(
    (set) => ({
      dismissed: false,
      setDismissed: (dismissed) => set({ dismissed }),
    }),
    {
      name: 'v2-pools.withdrawWarning',
      partialize: ({ dismissed }) => ({ dismissed }),
    },
  ),
);
