'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import {
  type ConnectedWallet,
  type PrivyClientConfig,
  PrivyProvider,
  getEmbeddedConnectedWallet,
  useActiveWallet,
  useConnectOrCreateWallet,
  useConnectWallet,
  useCreateWallet,
  useExportWallet,
  useLogin,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { toast } from '@repo/ui';
import type {
  PendingWalletAction,
  PrivyUserLike,
  WalletRuntimeValue,
} from '../privyCompat';

interface PrivyRuntimeInnerProps {
  appId: string;
  clientId: string;
  config: PrivyClientConfig;
  targetChain: TargetChain;
  pendingAction: PendingWalletAction;
  onPendingActionHandled: () => void;
  onRuntimeStateChange: (value: WalletRuntimeValue) => void;
}

interface TargetChain {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: readonly string[];
    };
  };
  blockExplorers?: {
    default: {
      url: string;
    };
  };
}

const isEmbeddedWalletClientType = (walletClientType?: string) =>
  walletClientType === 'privy' || walletClientType === 'privy-v2';

const isWalletLoginMethod = (loginMethod?: string | null) =>
  loginMethod === 'siwe' || loginMethod === 'siws';

const getWalletErrorCode = (error: unknown): number | undefined => {
  let current = error;

  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== 'object' || current === null) return undefined;

    const errorValue = current as Record<string, unknown>;
    const code = Number(errorValue.code);
    if (Number.isFinite(code)) return code;

    current = errorValue.cause ?? errorValue.data ?? errorValue.originalError;
  }

  return undefined;
};

const getWalletErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error;

  const messages: string[] = [];
  let current = error;

  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== 'object' || current === null) break;

    const errorValue = current as Record<string, unknown>;
    if (typeof errorValue.message === 'string') {
      messages.push(errorValue.message);
    }
    if (typeof errorValue.privyErrorCode === 'string') {
      messages.push(errorValue.privyErrorCode);
    }

    current = errorValue.cause ?? errorValue.data ?? errorValue.originalError;
  }

  return messages.join(' ');
};

const isChainMissingError = (error: unknown) => {
  if (getWalletErrorCode(error) === 4902) return true;

  return /chain.*(?:not added|not found)|unrecognized chain|unknown chain/i.test(
    getWalletErrorMessage(error),
  );
};

type ChainFailureStep = 'switch' | 'add';
const NETWORK_REQUEST_TIMEOUT_MS = 60_000;
const SIGNATURE_REQUEST_TIMEOUT_MS = 60_000;
const CHAIN_STATE_CHECK_TIMEOUT_MS = 3_000;

class WalletRequestTimeoutError extends Error {}

class ChainPreparationError extends Error {
  constructor(
    readonly step: ChainFailureStep,
    readonly walletError: unknown,
  ) {
    super(`Failed to ${step} wallet chain`);
  }
}

const isUserRejectedError = (error: unknown) =>
  getWalletErrorCode(error) === 4001 ||
  /user reject|user denied|request rejected/i.test(
    getWalletErrorMessage(error),
  );

const isUserCancelledError = (error: unknown) =>
  /exited_auth_flow|user[\s_-]*(?:cancelled|canceled|closed|exited)|(?:modal|dialog)[\s\S]*(?:cancelled|canceled|closed|dismissed)|(?:cancelled|canceled|closed|dismissed)[\s\S]*(?:modal|dialog)/i.test(
    getWalletErrorMessage(error),
  );

const isUnsupportedAddChainError = (error: unknown) => {
  if (error instanceof WalletRequestTimeoutError) return true;

  const code = getWalletErrorCode(error);
  return code === -32601 || code === -32603;
};

const requestWithTimeout = async <T,>(
  request: Promise<T>,
  timeoutMs: number,
) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new WalletRequestTimeoutError()),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const switchWalletChain = async (
  wallet: ConnectedWallet,
  targetChain: TargetChain,
) => {
  const chainId = `0x${targetChain.id.toString(16)}` as const;
  const getCurrentChainId = async (timeoutMs = NETWORK_REQUEST_TIMEOUT_MS) => {
    const provider = await wallet.getEthereumProvider();
    return Number(
      await requestWithTimeout(
        provider.request({ method: 'eth_chainId' }),
        timeoutMs,
      ),
    );
  };
  const isTargetChainActive = async () => {
    try {
      return (
        (await getCurrentChainId(CHAIN_STATE_CHECK_TIMEOUT_MS)) ===
        targetChain.id
      );
    } catch {
      return false;
    }
  };
  const requestSwitch = async () => {
    const provider = await wallet.getEthereumProvider();
    return requestWithTimeout(
      provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      }),
      NETWORK_REQUEST_TIMEOUT_MS,
    );
  };

  if ((await getCurrentChainId()) === targetChain.id) return;

  try {
    await requestSwitch();
  } catch (switchError) {
    if (
      switchError instanceof WalletRequestTimeoutError &&
      (await isTargetChainActive())
    ) {
      return;
    }

    if (!isChainMissingError(switchError)) {
      throw new ChainPreparationError('switch', switchError);
    }

    let addError: unknown;
    try {
      const provider = await wallet.getEthereumProvider();
      await requestWithTimeout(
        provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: [...targetChain.rpcUrls.default.http],
              blockExplorerUrls: targetChain.blockExplorers?.default
                ? [targetChain.blockExplorers.default.url]
                : undefined,
            },
          ],
        }),
        NETWORK_REQUEST_TIMEOUT_MS,
      );
    } catch (error) {
      if (error instanceof WalletRequestTimeoutError) {
        if (await isTargetChainActive()) return;

        throw new ChainPreparationError('add', error);
      }

      // OKX may add the chain but still reject this request with "User Reject".
      // Retry switching with a refreshed provider before treating add as failed.
      addError = error;
    }

    try {
      await requestSwitch();
    } catch (retryError) {
      console.error('Failed to switch after adding wallet chain', {
        addError,
        retryError,
      });
      throw new ChainPreparationError(
        addError ? 'add' : 'switch',
        addError ?? retryError,
      );
    }
  }

  const currentChainId = await getCurrentChainId();
  if (currentChainId !== targetChain.id) {
    throw new ChainPreparationError(
      'switch',
      new Error(
        `Wallet remained on chain ${currentChainId}; expected ${targetChain.id}`,
      ),
    );
  }
};

const showManualAddChainToast = (targetChain: TargetChain) => {
  const chainName = targetChain.name;

  toast.error(
    <span>
      <Trans id="wallet.unsupportedNetworkAdd">
        This wallet can&apos;t add {chainName} automatically.
      </Trans>{' '}
      <a
        href={`https://chainlist.org/chain/${targetChain.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent"
      >
        <Trans>Add it manually to continue.</Trans>
      </a>
    </span>,
    { id: 'privy-wallet-chain' },
  );
};

const showChainFailureToast = (error: unknown, targetChain: TargetChain) => {
  const chainName = targetChain.name;

  if (!(error instanceof ChainPreparationError)) {
    showManualAddChainToast(targetChain);
    return;
  }

  if (error.step === 'switch') {
    if (isUserRejectedError(error.walletError)) {
      toast.error(
        t({
          id: 'wallet.networkSwitchRejected',
          message: `Network switch rejected. Switch to ${chainName} to continue.`,
        }),
        { id: 'privy-wallet-chain' },
      );
      return;
    }

    showManualAddChainToast(targetChain);
    return;
  }

  if (isUnsupportedAddChainError(error.walletError)) {
    showManualAddChainToast(targetChain);
    return;
  }

  if (isUserRejectedError(error.walletError)) {
    toast.error(
      t({
        id: 'wallet.networkAddRejected',
        message: `Network add rejected. Add ${chainName} to your wallet to continue.`,
      }),
      { id: 'privy-wallet-chain' },
    );
    return;
  }

  showManualAddChainToast(targetChain);
};

function PrivyBridge({
  targetChain,
  pendingAction,
  onPendingActionHandled,
  onRuntimeStateChange,
}: Pick<
  PrivyRuntimeInnerProps,
  | 'targetChain'
  | 'pendingAction'
  | 'onPendingActionHandled'
  | 'onRuntimeStateChange'
>) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { exportWallet } = useExportWallet();
  const { wallet, setActiveWallet } = useActiveWallet();
  const { ready: walletsReady, wallets } = useWallets();
  const [preferEmbeddedWallet, setPreferEmbeddedWallet] = useState(false);
  const { login } = useLogin({
    onComplete: ({ loginMethod }) => {
      setPreferEmbeddedWallet(
        !!loginMethod && !isWalletLoginMethod(loginMethod),
      );
    },
  });
  const { createWallet } = useCreateWallet();
  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      setPreferEmbeddedWallet(false);
      if ('getEthereumProvider' in wallet) {
        void setActiveWallet(wallet as ConnectedWallet);
      }
    },
  });
  const preparingExternalWalletRef = useRef<string | undefined>(undefined);
  const walletLoginFlowRef = useRef(false);
  const { connectOrCreateWallet: openConnectOrCreateWallet } =
    useConnectOrCreateWallet({
      onError: (error) => {
        if (!walletLoginFlowRef.current) return;

        walletLoginFlowRef.current = false;
        if (isUserCancelledError(error)) {
          toast.dismiss('privy-wallet-connect');
          return;
        }

        toast.error(
          isUserRejectedError(error)
            ? t`Connection request rejected. Approve it in your wallet to continue.`
            : t`Something went wrong. Please try again.`,
          { id: 'privy-wallet-connect' },
        );
      },
      onSuccess: async ({ wallet }) => {
        setPreferEmbeddedWallet(false);
        toast.dismiss('privy-wallet-connect');

        if (!('getEthereumProvider' in wallet)) {
          walletLoginFlowRef.current = false;
          toast.error(t`Something went wrong. Please try again.`, {
            id: 'privy-wallet-connect',
          });
          return;
        }

        const connectedWallet = wallet as ConnectedWallet;
        const walletAddress = connectedWallet.address.toLowerCase();
        void setActiveWallet(connectedWallet);

        if (!walletLoginFlowRef.current) return;

        if (isEmbeddedWalletClientType(wallet.walletClientType)) {
          walletLoginFlowRef.current = false;
          setPreferEmbeddedWallet(true);
          return;
        }

        if (preparingExternalWalletRef.current) return;

        preparingExternalWalletRef.current = walletAddress;
        setPreferEmbeddedWallet(false);
        const chainName = targetChain.name;
        toast.loading(
          t({
            id: 'wallet.switchingNetwork',
            message: `Switching to ${chainName}...`,
          }),
          { id: 'privy-wallet-chain' },
        );

        try {
          await switchWalletChain(connectedWallet, targetChain);
        } catch (error) {
          console.error('Failed to prepare external wallet chain', error);
          showChainFailureToast(error, targetChain);
          preparingExternalWalletRef.current = undefined;
          walletLoginFlowRef.current = false;
          return;
        }

        toast.dismiss('privy-wallet-chain');
        toast.loading(t`Waiting for wallet signature...`, {
          id: 'privy-wallet-login',
        });

        try {
          await requestWithTimeout(
            connectedWallet.loginOrLink(),
            SIGNATURE_REQUEST_TIMEOUT_MS,
          );
          toast.dismiss('privy-wallet-login');
        } catch (error) {
          console.error('Failed to sign in with external wallet', error);
          toast.error(
            error instanceof WalletRequestTimeoutError
              ? t`Signature request timed out. Please try again.`
              : isUserRejectedError(error)
                ? t`Signature request rejected. Sign in your wallet to log in.`
                : t`Something went wrong. Please try again.`,
            { id: 'privy-wallet-login' },
          );
        } finally {
          preparingExternalWalletRef.current = undefined;
          walletLoginFlowRef.current = false;
        }
      },
    });
  const connectOrCreateWallet = useCallback(() => {
    if (walletLoginFlowRef.current) return;

    walletLoginFlowRef.current = true;
    toast.loading(t`Connecting wallet...`, {
      id: 'privy-wallet-connect',
    });
    openConnectOrCreateWallet();
  }, [openConnectOrCreateWallet]);
  const lastStableWalletRef = useRef<ConnectedWallet | undefined>(undefined);
  const lastStableWalletsRef = useRef<ConnectedWallet[]>([]);
  const pendingProviderAccountRef = useRef<string | undefined>(undefined);
  const creatingEmbeddedWalletRef = useRef(false);
  const [disconnectedWalletAddress, setDisconnectedWalletAddress] =
    useState<string>();

  useEffect(() => {
    if (!authenticated) {
      lastStableWalletRef.current = undefined;
      lastStableWalletsRef.current = [];
      pendingProviderAccountRef.current = undefined;
      creatingEmbeddedWalletRef.current = false;
      setPreferEmbeddedWallet(false);
      setDisconnectedWalletAddress(undefined);
      return;
    }

    if (wallet?.address) {
      lastStableWalletRef.current = wallet as ConnectedWallet;
    }

    if (wallets.length > 0) {
      lastStableWalletsRef.current = wallets as ConnectedWallet[];
    }
  }, [authenticated, wallet, wallets]);

  useEffect(() => {
    if (!authenticated || !preferEmbeddedWallet) return;

    const knownWallets =
      wallets.length > 0
        ? (wallets as ConnectedWallet[])
        : lastStableWalletsRef.current;
    const embeddedWallet = getEmbeddedConnectedWallet(knownWallets);

    if (embeddedWallet) {
      if (
        wallet?.address.toLowerCase() !== embeddedWallet.address.toLowerCase()
      ) {
        void setActiveWallet(embeddedWallet);
      }
      return;
    }

    const hasEmbeddedWallet =
      user?.linkedAccounts?.some(
        (account) =>
          account.type === 'wallet' &&
          account.chainType === 'ethereum' &&
          isEmbeddedWalletClientType(account.walletClientType),
      ) ?? false;

    if (hasEmbeddedWallet || creatingEmbeddedWalletRef.current) return;

    creatingEmbeddedWalletRef.current = true;
    void createWallet()
      .catch(() => undefined)
      .finally(() => {
        creatingEmbeddedWalletRef.current = false;
      });
  }, [
    authenticated,
    createWallet,
    preferEmbeddedWallet,
    setActiveWallet,
    user?.linkedAccounts,
    wallet?.address,
    wallets,
  ]);

  useEffect(() => {
    if (!authenticated) return;

    const knownWallets =
      wallets.length > 0
        ? (wallets as ConnectedWallet[])
        : lastStableWalletsRef.current;
    const walletsToWatch =
      knownWallets.length > 0
        ? knownWallets
        : wallet?.address
          ? [wallet as ConnectedWallet]
          : [];

    if (walletsToWatch.length === 0) return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];
    const syncActiveWallet = (
      connectedWallet: ConnectedWallet,
      accounts: unknown,
    ) => {
      const nextAddress = Array.isArray(accounts) ? accounts[0] : undefined;
      const connectedWalletAddress = connectedWallet.address.toLowerCase();

      if (typeof nextAddress !== 'string') {
        pendingProviderAccountRef.current = undefined;
        setDisconnectedWalletAddress(connectedWalletAddress);
        lastStableWalletRef.current = undefined;
        lastStableWalletsRef.current = lastStableWalletsRef.current.filter(
          ({ address }) => address.toLowerCase() !== connectedWalletAddress,
        );
        return;
      }

      const normalizedNextAddress = nextAddress.toLowerCase();
      setDisconnectedWalletAddress((address) =>
        address === normalizedNextAddress ? undefined : address,
      );

      if (normalizedNextAddress === connectedWalletAddress) {
        pendingProviderAccountRef.current = undefined;
        return;
      }

      const nextWallet = knownWallets.find(
        ({ address }) => address.toLowerCase() === nextAddress.toLowerCase(),
      );

      if (nextWallet) {
        pendingProviderAccountRef.current = undefined;
        void setActiveWallet(nextWallet);
        return;
      }

      pendingProviderAccountRef.current = normalizedNextAddress;
    };

    walletsToWatch.forEach((connectedWallet) => {
      if (!connectedWallet.getEthereumProvider) return;

      connectedWallet
        .getEthereumProvider()
        .then((provider) => {
          if (cancelled) return;

          const listener = (accounts: unknown) => {
            syncActiveWallet(connectedWallet, accounts);
          };

          cleanups.push(() =>
            provider.removeListener('accountsChanged', listener),
          );
          provider.on('accountsChanged', listener);
          provider
            .request({ method: 'eth_accounts' })
            .then(listener)
            .catch(() => undefined);
        })
        .catch(() => undefined);
    });

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [authenticated, setActiveWallet, wallet, wallets]);

  useEffect(() => {
    const pendingAddress = pendingProviderAccountRef.current;
    if (!authenticated || !pendingAddress) return;

    const nextWallet = (wallets as ConnectedWallet[]).find(
      ({ address }) => address.toLowerCase() === pendingAddress,
    );

    if (!nextWallet) return;

    pendingProviderAccountRef.current = undefined;
    void setActiveWallet(nextWallet);
  }, [authenticated, setActiveWallet, wallets]);

  const runtimeState = useMemo<WalletRuntimeValue>(() => {
    const activeWallet = authenticated
      ? ((wallet as ConnectedWallet | undefined) ?? lastStableWalletRef.current)
      : undefined;
    const runtimeWallet =
      activeWallet?.address.toLowerCase() === disconnectedWalletAddress
        ? undefined
        : activeWallet;
    const runtimeWallets = authenticated
      ? wallets.length > 0
        ? (wallets as ConnectedWallet[])
        : lastStableWalletsRef.current
      : [];

    return {
      runtimeEnabled: true,
      runtimeReady: ready && walletsReady,
      ready,
      authenticated,
      user: (user as PrivyUserLike) ?? null,
      wallet: runtimeWallet,
      wallets: disconnectedWalletAddress
        ? runtimeWallets.filter(
            ({ address }) =>
              address.toLowerCase() !== disconnectedWalletAddress,
          )
        : runtimeWallets,
      login,
      connectOrCreateWallet,
      logout,
      exportWallet,
      connectWallet,
      setActiveWallet: setActiveWallet as WalletRuntimeValue['setActiveWallet'],
    };
  }, [
    authenticated,
    connectWallet,
    connectOrCreateWallet,
    disconnectedWalletAddress,
    exportWallet,
    login,
    logout,
    ready,
    setActiveWallet,
    user,
    wallet,
    wallets,
    walletsReady,
  ]);

  useEffect(() => {
    onRuntimeStateChange(runtimeState);
  }, [onRuntimeStateChange, runtimeState]);

  useEffect(() => {
    if (!pendingAction || !ready || !walletsReady) return;

    if (pendingAction === 'login' && !authenticated) {
      void login();
      onPendingActionHandled();
      return;
    }

    if (pendingAction === 'connectWallet' && authenticated) {
      void connectWallet();
      onPendingActionHandled();
      return;
    }

    if (pendingAction === 'connectWallet' && !authenticated) {
      void connectOrCreateWallet();
      onPendingActionHandled();
      return;
    }

    if (pendingAction === 'connectOrCreateWallet' && !authenticated) {
      void connectOrCreateWallet();
      onPendingActionHandled();
      return;
    }
  }, [
    authenticated,
    connectWallet,
    connectOrCreateWallet,
    login,
    onPendingActionHandled,
    pendingAction,
    ready,
    walletsReady,
  ]);

  return null;
}

export default function PrivyRuntimeInner({
  appId,
  clientId,
  config,
  targetChain,
  pendingAction,
  onPendingActionHandled,
  onRuntimeStateChange,
}: PrivyRuntimeInnerProps) {
  return (
    <PrivyProvider appId={appId} clientId={clientId} config={config}>
      <PrivyBridge
        targetChain={targetChain}
        pendingAction={pendingAction}
        onPendingActionHandled={onPendingActionHandled}
        onRuntimeStateChange={onRuntimeStateChange}
      />
    </PrivyProvider>
  );
}
