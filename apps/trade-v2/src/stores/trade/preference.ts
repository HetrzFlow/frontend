import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Leverage mode types
export type LeverageMode = 'normal' | 'hyper';

export const DEFAULT_SWAP_SLIPPAGE = '0.005';

export interface DismissedAnnouncementRecord {
  createdAt: string;
  expireAt: string;
}

const pruneDismissedAnnouncements = (
  items: DismissedAnnouncementRecord[],
  now = Date.now(),
) =>
  items.filter(
    (item) =>
      typeof item.createdAt === 'string' &&
      item.createdAt.length > 0 &&
      typeof item.expireAt === 'string' &&
      Number.isFinite(Date.parse(item.expireAt)) &&
      Date.parse(item.expireAt) > now,
  );

interface PreferenceStore {
  slippage: string;
  swapSlippage: string;
  keepLeverage: boolean;
  favorites: Map<string, boolean>; // key: marketAddress, value: isFavorited
  leverageMode: LeverageMode;
  hideHyperRiskDialog: boolean;
  hideHyperRiskDialogPersist: boolean;
  dismissedAnnouncementRecords: DismissedAnnouncementRecord[];
  setSlippage: (slippage: string) => void;
  setSwapSlippage: (swapSlippage: string) => void;
  setLeverageMode: (mode: LeverageMode) => void;
  setState: (state: Partial<PreferenceStore>) => void;
  toggleFavorite: (marketAddress: string) => void;
  isFavorite: (marketAddress: string) => boolean;
  getFavoriteMarkets: () => string[];
  addDismissedAnnouncementRecord: (createdAt: string, expireAt: string) => void;
  pruneDismissedAnnouncementRecords: (now?: number) => void;
  hasDismissedAnnouncementRecord: (createdAt: string) => boolean;
}

type PersistedStateType = {
  slippage?: string;
  swapSlippage?: string;
  keepLeverage?: boolean;
  favorites: Record<string, boolean>; // Map serialized as object for persistence
  hideHyperLeverageRiskDialog?: boolean;
  dismissedAnnouncementRecords?: DismissedAnnouncementRecord[];
};

export const usePreferenceStore = create<
  PreferenceStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      slippage: '0.02',
      swapSlippage: DEFAULT_SWAP_SLIPPAGE,
      keepLeverage: false,
      favorites: new Map<string, boolean>(),
      leverageMode: 'normal',
      hideHyperRiskDialog: false,
      hideHyperRiskDialogPersist: false,
      dismissedAnnouncementRecords: [],
      setSlippage: (slippage) => set({ slippage }),
      setSwapSlippage: (swapSlippage) => set({ swapSlippage }),
      setLeverageMode: (leverageMode) => set({ leverageMode }),
      setState: (state) => set(state),
      toggleFavorite: (marketAddress: string) => {
        const { favorites } = get();
        const newFavorites = new Map(favorites);
        const currentStatus = newFavorites.get(marketAddress) || false;
        newFavorites.set(marketAddress, !currentStatus);
        set({ favorites: newFavorites });
      },
      isFavorite: (marketAddress: string) => {
        const { favorites } = get();
        return favorites.get(marketAddress) || false;
      },
      getFavoriteMarkets: () => {
        const { favorites } = get();
        return Array.from(favorites.entries())
          .filter(([, isFavorited]) => isFavorited)
          .map(([address]) => address);
      },
      addDismissedAnnouncementRecord: (createdAt: string, expireAt: string) => {
        const { dismissedAnnouncementRecords } = get();
        const nextItems = pruneDismissedAnnouncements(
          dismissedAnnouncementRecords,
        );

        if (nextItems.some((item) => item.createdAt === createdAt)) {
          if (nextItems !== dismissedAnnouncementRecords) {
            set({ dismissedAnnouncementRecords: nextItems });
          }
          return;
        }

        set({
          dismissedAnnouncementRecords: [
            ...nextItems,
            {
              createdAt,
              expireAt,
            },
          ],
        });
      },
      pruneDismissedAnnouncementRecords: (now = Date.now()) => {
        const { dismissedAnnouncementRecords } = get();
        const nextItems = pruneDismissedAnnouncements(
          dismissedAnnouncementRecords,
          now,
        );

        if (nextItems.length !== dismissedAnnouncementRecords.length) {
          set({ dismissedAnnouncementRecords: nextItems });
        }
      },
      hasDismissedAnnouncementRecord: (createdAt: string) => {
        const { dismissedAnnouncementRecords } = get();
        return dismissedAnnouncementRecords.some(
          (item) => item.createdAt === createdAt,
        );
      },
    }),
    {
      name: 'v2-trade.preferenceStore', // localStorage key
      partialize: ({
        slippage,
        swapSlippage,
        keepLeverage,
        favorites,
        hideHyperRiskDialogPersist,
        dismissedAnnouncementRecords,
      }) => ({
        slippage,
        swapSlippage,
        keepLeverage,
        favorites: Object.fromEntries(favorites),
        hideHyperRiskDialogPersist,
        dismissedAnnouncementRecords,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as PersistedStateType),
        favorites: new Map(
          Object.entries(
            (persistedState as PersistedStateType).favorites || {},
          ),
        ),
        dismissedAnnouncementRecords: pruneDismissedAnnouncements(
          (persistedState as PersistedStateType).dismissedAnnouncementRecords ||
            [],
        ),
      }),
    },
  ),
);
