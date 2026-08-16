import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PersistedGenesisAccessState = {
  hasAcceptedAgreement: boolean;
  withdrawWarningDismissed: boolean;
};

interface GenesisAccessStore extends PersistedGenesisAccessState {
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  acceptAgreement: () => void;
  setWithdrawWarningDismissed: (dismissed: boolean) => void;
}

export const useGenesisAccessStore = create<
  GenesisAccessStore,
  [['zustand/persist', PersistedGenesisAccessState]]
>(
  persist(
    (set) => ({
      hasHydrated: false,
      hasAcceptedAgreement: false,
      withdrawWarningDismissed: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      acceptAgreement: () => set({ hasAcceptedAgreement: true }),
      setWithdrawWarningDismissed: (withdrawWarningDismissed) =>
        set({ withdrawWarningDismissed }),
    }),
    {
      name: 'v2-genesis.accessStore',
      version: 2,
      partialize: ({ hasAcceptedAgreement, withdrawWarningDismissed }) => ({
        hasAcceptedAgreement,
        withdrawWarningDismissed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
