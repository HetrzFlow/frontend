import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NetworkType = 'testnet' | 'mainnet';

const DEPLOYMENT_NETWORK: NetworkType =
  process.env.NEXT_PUBLIC_FORCE_CHAIN_ID === '56' ? 'mainnet' : 'testnet';

const DEFAULT_PERSISTED_STATE: PersistedStateType = {
  network: DEPLOYMENT_NETWORK,
};

interface WalletStore {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
}

type PersistedStateType = {
  network: NetworkType;
};

const normalizePersistedState = (): PersistedStateType =>
  DEFAULT_PERSISTED_STATE;

export const useWalletStore = create<
  WalletStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set) => ({
      network: DEPLOYMENT_NETWORK,
      setNetwork: (network) => set({ network }),
    }),
    {
      name: 'v2-common.walletStore', // localStorage key
      partialize: ({ network }) => ({ network }),
      merge: (persistedState, currentState) => {
        void persistedState;
        return {
          ...currentState,
          ...normalizePersistedState(),
        };
      },
    },
  ),
);
