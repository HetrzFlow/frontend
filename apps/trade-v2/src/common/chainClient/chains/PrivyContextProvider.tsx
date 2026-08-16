'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { type PrivyClientConfig } from '@privy-io/react-auth';
import { bsc, bscTestnet } from 'viem/chains';
import { queryClient, QueryClientProvider } from '@repo/lib/queryClient';

import { FORCE_CHAIN_ID } from '@/constants/common';
import {
  FALLBACK_WALLET_RUNTIME_VALUE,
  type PendingWalletAction,
  WalletRuntimeContext,
  type WalletRuntimeValue,
} from '../privyCompat';
import HzSdkContextProvider from './HzSdkContextProvider';

interface PrivyContextProviderProps {
  children: ReactNode;
}

const PrivyRuntimeInner = dynamic(() => import('./PrivyRuntimeInner'), {
  ssr: false,
});

const IDLE_PRELOAD_TIMEOUT_MS = 1500;
type RuntimeQueuedAction = Exclude<PendingWalletAction, null>;

function PrivyProviderContent({ children }: { children: ReactNode }) {
  const [runtimeEnabled, setRuntimeEnabled] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingWalletAction>(null);
  const [runtimeState, setRuntimeState] = useState<WalletRuntimeValue>(
    FALLBACK_WALLET_RUNTIME_VALUE,
  );

  const targetChain =
    getViemChain(FORCE_CHAIN_ID || bscTestnet.id) || bscTestnet;

  const privyConfig: PrivyClientConfig = useMemo(() => {
    return {
      embeddedWallets: {
        showWalletUIs: true,
        ethereum: {
          createOnLogin: 'users-without-wallets',
        },
      },
      supportedChains: [bscTestnet, bsc],
      appearance: {
        showWalletLoginFirst: true,
        theme: 'dark',
        accentColor: '#00dfeb',
        walletList: [
          ...(targetChain.id === bsc.id ? (['binance'] as const) : []),
          'okx_wallet',
          'bitget_wallet',
          'metamask',
          'detected_ethereum_wallets',
          'wallet_connect',
        ],
      },
      loginMethods: ['wallet', 'google', 'twitter'],
    };
  }, [targetChain]);

  useEffect(() => {
    if (runtimeEnabled) return;

    let cancelled = false;
    const win = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions,
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

    const enableRuntime = () => {
      if (!cancelled) {
        setRuntimeEnabled(true);
      }
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(enableRuntime, {
        timeout: IDLE_PRELOAD_TIMEOUT_MS,
      });

      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = win.setTimeout(enableRuntime, IDLE_PRELOAD_TIMEOUT_MS);

    return () => {
      cancelled = true;
      win.clearTimeout(timeoutId);
    };
  }, [runtimeEnabled]);

  const handleRuntimeStateChange = useCallback((value: WalletRuntimeValue) => {
    setRuntimeState(value);
  }, []);

  const handlePendingActionHandled = useCallback(() => {
    setPendingAction(null);
  }, []);

  const enableRuntime = useCallback((action?: RuntimeQueuedAction) => {
    setRuntimeEnabled(true);
    if (action) {
      setPendingAction((prev) => prev ?? action);
    }
    return Promise.resolve();
  }, []);

  const runWhenRuntimeReady = useCallback(
    (handler: () => Promise<void> | void, action?: RuntimeQueuedAction) => {
      if (runtimeState.runtimeReady) {
        return handler();
      }
      return enableRuntime(action);
    },
    [enableRuntime, runtimeState.runtimeReady],
  );

  const contextValue = useMemo<WalletRuntimeValue>(() => {
    const login: WalletRuntimeValue['login'] = () =>
      runWhenRuntimeReady(runtimeState.login, 'login');

    const connectOrCreateWallet: WalletRuntimeValue['connectOrCreateWallet'] =
      () =>
        runWhenRuntimeReady(
          runtimeState.connectOrCreateWallet,
          'connectOrCreateWallet',
        );

    const connectWallet: WalletRuntimeValue['connectWallet'] = () =>
      runWhenRuntimeReady(runtimeState.connectWallet, 'connectWallet');

    const logout: WalletRuntimeValue['logout'] = () =>
      runWhenRuntimeReady(runtimeState.logout);

    const setActiveWallet: WalletRuntimeValue['setActiveWallet'] = (wallet) => {
      return runWhenRuntimeReady(() => runtimeState.setActiveWallet(wallet));
    };

    return {
      ...runtimeState,
      runtimeEnabled,
      login,
      connectOrCreateWallet,
      connectWallet,
      logout,
      setActiveWallet,
    };
  }, [runWhenRuntimeReady, runtimeEnabled, runtimeState]);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletRuntimeContext.Provider value={contextValue}>
        <HzSdkContextProvider>{children}</HzSdkContextProvider>
        {runtimeEnabled ? (
          <PrivyRuntimeInner
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
            config={privyConfig}
            targetChain={targetChain}
            pendingAction={pendingAction}
            onPendingActionHandled={handlePendingActionHandled}
            onRuntimeStateChange={handleRuntimeStateChange}
          />
        ) : null}
      </WalletRuntimeContext.Provider>
    </QueryClientProvider>
  );
}

export default function PrivyContextProvider({
  children,
}: PrivyContextProviderProps) {
  return <PrivyProviderContent>{children}</PrivyProviderContent>;
}
