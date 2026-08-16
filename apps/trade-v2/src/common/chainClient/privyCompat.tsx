'use client';

import { createContext, useContext } from 'react';
import type { ConnectedWallet } from '@privy-io/react-auth';

export type PrivyUserLike = {
  id?: string;
  linkedAccounts?: Array<{
    type?: string;
    address?: string;
    walletClientType?: string;
    chainType?: string;
  }>;
} | null;

export type PendingWalletAction =
  | 'login'
  | 'connectWallet'
  | 'connectOrCreateWallet'
  | null;

export interface WalletRuntimeValue {
  runtimeEnabled: boolean;
  runtimeReady: boolean;
  ready: boolean;
  authenticated: boolean;
  user: PrivyUserLike;
  wallet: ConnectedWallet | undefined;
  wallets: ConnectedWallet[];
  login: () => Promise<void> | void;
  connectOrCreateWallet: () => Promise<void> | void;
  logout: () => Promise<void> | void;
  exportWallet: (options?: { address: string }) => Promise<void> | void;
  connectWallet: () => Promise<void> | void;
  setActiveWallet: (wallet: ConnectedWallet) => Promise<void> | void;
}

const noopAsync = async () => undefined;

export const FALLBACK_WALLET_RUNTIME_VALUE: WalletRuntimeValue = {
  runtimeEnabled: false,
  runtimeReady: false,
  ready: false,
  authenticated: false,
  user: null,
  wallet: undefined,
  wallets: [],
  login: noopAsync,
  connectOrCreateWallet: noopAsync,
  logout: noopAsync,
  exportWallet: noopAsync,
  connectWallet: noopAsync,
  setActiveWallet: noopAsync,
};

export const WalletRuntimeContext = createContext<WalletRuntimeValue>(
  FALLBACK_WALLET_RUNTIME_VALUE,
);

export const useWalletRuntime = () => useContext(WalletRuntimeContext);

export const usePrivy = () => {
  const {
    ready,
    authenticated,
    user,
    login,
    connectOrCreateWallet,
    logout,
    exportWallet,
    runtimeReady,
    runtimeEnabled,
  } = useWalletRuntime();

  return {
    ready,
    authenticated,
    user,
    login,
    connectOrCreateWallet,
    logout,
    exportWallet,
    runtimeReady,
    runtimeEnabled,
  };
};

export const useActiveWallet = () => {
  const { wallet, setActiveWallet } = useWalletRuntime();
  return { wallet, setActiveWallet };
};

export const useWallets = () => {
  const { wallets } = useWalletRuntime();
  return { wallets };
};

export const useConnectWallet = () => {
  const { connectWallet } = useWalletRuntime();
  return { connectWallet };
};
