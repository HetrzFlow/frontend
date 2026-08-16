import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PoolFavoritesStore {
  favorites: Map<string, boolean>;
  toggleFavorite: (marketAddress: string) => void;
  isFavorite: (marketAddress: string) => boolean;
  getFavoritePools: () => string[];
}

type PersistedStateType = {
  favorites: Record<string, boolean>;
};

const normalizeAddress = (marketAddress: string) => marketAddress.toLowerCase();

export const usePoolFavoritesStore = create<
  PoolFavoritesStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      favorites: new Map<string, boolean>(),
      toggleFavorite: (marketAddress: string) => {
        const normalizedAddress = normalizeAddress(marketAddress);
        const { favorites } = get();
        const newFavorites = new Map(favorites);
        const currentStatus = newFavorites.get(normalizedAddress) || false;
        newFavorites.set(normalizedAddress, !currentStatus);
        set({ favorites: newFavorites });
      },
      isFavorite: (marketAddress: string) => {
        const normalizedAddress = normalizeAddress(marketAddress);
        const { favorites } = get();
        return favorites.get(normalizedAddress) || false;
      },
      getFavoritePools: () => {
        const { favorites } = get();
        const favoritePools: string[] = [];

        for (const [address, isFavorited] of favorites.entries()) {
          if (isFavorited) {
            favoritePools.push(address);
          }
        }

        return favoritePools;
      },
    }),
    {
      name: 'v2-pools.favoritesStore',
      partialize: ({ favorites }) => ({
        favorites: Object.fromEntries(favorites),
      }),
      merge: (persistedState, currentState) => {
        const _persistedState = persistedState as PersistedStateType;
        return {
          ...currentState,
          ..._persistedState,
          favorites: new Map(Object.entries(_persistedState.favorites || {})),
        };
      },
    },
  ),
);
