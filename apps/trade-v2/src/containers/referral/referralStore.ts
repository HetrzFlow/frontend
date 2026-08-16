import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PersistedStateType = {
  skippedAddresses: Record<string, boolean>;
};

interface ReferralStore {
  hasHydrated: boolean;
  pendingRefCode: string | null;
  skippedAddresses: Record<string, boolean>;
  isOverlayActive: boolean;
  setHasHydrated: (value: boolean) => void;
  setPendingRefCode: (code: string | null) => void;
  clearPendingRefCode: () => void;
  skipForAddress: (address: string) => void;
  hasSkipped: (address: string) => boolean;
  setOverlayActive: (value: boolean) => void;
}

const normalizeAddress = (address: string) => address.toLowerCase();

export const useReferralStore = create<
  ReferralStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      hasHydrated: false,
      pendingRefCode: null,
      skippedAddresses: {},
      isOverlayActive: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setPendingRefCode: (code) => set({ pendingRefCode: code }),
      clearPendingRefCode: () => set({ pendingRefCode: null }),
      setOverlayActive: (value) => set({ isOverlayActive: value }),
      skipForAddress: (address: string) => {
        const normalizedAddress = normalizeAddress(address);
        set((state) => ({
          skippedAddresses: {
            ...state.skippedAddresses,
            [normalizedAddress]: true,
          },
        }));
      },
      hasSkipped: (address: string) => {
        const normalizedAddress = normalizeAddress(address);
        return !!get().skippedAddresses[normalizedAddress];
      },
    }),
    {
      name: 'v2-referral.store',
      partialize: ({ skippedAddresses }) => ({ skippedAddresses }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
