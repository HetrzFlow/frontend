import { useWallets } from '@mysten/dapp-kit';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NetworkType = 'testnet' | 'mainnet';

export const SUPPORTED_NETWORKS: NetworkType[] = ['testnet', 'mainnet'];

export type RpcKeyType =
  | 'default'
  // | 'BlockVision'
  | 'Suiet'
  | 'Blast'
  | 'Suiscan'
  | 'Custom';

export const SUPPORTED_RPC_KEYS: RpcKeyType[] = [
  'default',
  'Blast',
  // 'BlockVision',
  'Suiet',
  'Suiscan',
  'Custom',
];

export const explorers = {
  suivision: {
    testnet: 'https://testnet.suivision.xyz',
    mainnet: 'https://suivision.xyz',
  },
};

interface WalletStore {
  network: NetworkType;
  rpcKey: RpcKeyType;
  customRpc: { testnet: string; mainnet: string };
  recentWalletName: string;
  recentAccountAddress: string;
  autoConnectStatus: 'idle' | 'attempted';
  getExplorerHost: () => string;
  setNetwork: (network: NetworkType) => void;
  setRpcKey: (rpcKey: RpcKeyType) => void;
  setRecentWalletName: (wallet: ReturnType<typeof useWallets>[0]) => void;
  setRecentAccountAddress: (recentAccountAddress: string) => void;
  setAutoConnectStatus: (status: 'idle' | 'attempted') => void;
  setCustomRpc: (key: NetworkType, value: string) => void;
}

type PersistedStateType = {
  network: NetworkType;
  rpcKey: RpcKeyType;
  customRpc: { testnet: string; mainnet: string };
  recentWalletName: string;
  recentAccountAddress: string;
};

export const useWalletStore = create<
  WalletStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      network: 'testnet',
      rpcKey: 'default',
      customRpc: { testnet: '', mainnet: '' },
      recentWalletName: '',
      recentAccountAddress: '',
      autoConnectStatus: 'idle',
      getExplorerHost: () => {
        return explorers.suivision[get().network];
      },
      setNetwork: (network) => set({ network }),
      setRpcKey: (rpcKey) => set({ rpcKey }),
      setRecentWalletName: (wallet) =>
        set({ recentWalletName: wallet.id || wallet.name }),
      setRecentAccountAddress: (recentAccountAddress) =>
        set({ recentAccountAddress }),
      setAutoConnectStatus: (status) => set({ autoConnectStatus: status }),
      setCustomRpc: (key, value) => {
        set({
          customRpc: {
            ...get().customRpc,
            [key]: value,
          },
        });
      },
    }),
    {
      name: 'v1-common.walletStore', // localStorage key
      partialize: ({
        network,
        rpcKey,
        recentWalletName,
        customRpc,
        recentAccountAddress,
      }) => ({
        network,
        rpcKey,
        customRpc,
        recentWalletName,
        recentAccountAddress,
      }),
      merge: (persistedState, currentState) => {
        const _persistedState = persistedState as PersistedStateType;
        return {
          ...currentState,
          ..._persistedState,
          rpcKey: SUPPORTED_RPC_KEYS.includes(_persistedState.rpcKey)
            ? _persistedState.rpcKey
            : 'default',
          // TODO: disabled mainnet,
          network: ['testnet'].includes(_persistedState.network)
            ? _persistedState.network
            : 'testnet',
        };
      },
    },
  ),
);
