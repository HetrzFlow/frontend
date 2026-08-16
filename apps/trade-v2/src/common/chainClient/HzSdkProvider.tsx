'use client';

import { createContext, FC, ReactNode, useEffect, useState } from 'react';
import {
  getTransactionErrorDetails,
  TxErrorType,
} from '@hertzflow/sdk-v2/utils/errors/transactionsErrors';
import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  shouldThrow as shouldThrowFallbackError,
  custom,
  type Transport,
  type Chain,
} from 'viem';
import { bsc, bscTestnet } from 'viem/chains';
import { isDebugMode } from '@/common/constants';
import { fetchStatsTokens } from '@/common/services/rest/stats';
import {
  BSC_DATA_ORACLE_API_BASE_URL,
  FORCE_CHAIN_ID,
} from '@/constants/common';
import { WS_RPC_URLS, HTTP_RPC_URLS } from './const';
import { useCurrentAccountAddress } from './hooks';
import { useActiveWallet } from './privyCompat';

import type { HertzFlowSDK } from '@hertzflow/sdk-v2';
import type { ContractsChainId } from '@hertzflow/sdk-v2/configs/chains';
import type { HertzFlowSdkConfig } from '@hertzflow/sdk-v2/types/sdk';
import type { ConnectedWallet } from '@privy-io/react-auth';

export const HzSdkContext = createContext<HertzFlowSDK | null>(null);

function shouldStopRpcFallback(error: Error) {
  return (
    shouldThrowFallbackError(error) ||
    getTransactionErrorDetails(error).type === TxErrorType.NotEnoughFunds
  );
}

export const HzSdkProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const userAddress = useCurrentAccountAddress();
  const { wallet } = useActiveWallet();

  const walletChainId = Number(
    (wallet as ConnectedWallet | undefined)?.chainId?.split(':')[1],
  );

  const [hzSdk, setHzSdk] = useState<HertzFlowSDK | null>(null);
  const [chain, setChain] = useState<Chain>(bscTestnet);
  const effectiveChainId = FORCE_CHAIN_ID ?? walletChainId;

  useEffect(() => {
    let cancelled = false;
    let sdkInstance: HertzFlowSDK | null = null;

    void (async () => {
      const [{ HertzFlowSDK }, { BATCH_CONFIGS }, { getViemChain }] =
        await Promise.all([
          import('@hertzflow/sdk-v2'),
          import('@hertzflow/sdk-v2/configs/batch'),
          import('@hertzflow/sdk-v2/configs/chains'),
        ]);

      if (cancelled) return;

      const resolvedChain = effectiveChainId
        ? getViemChain(effectiveChainId) || bscTestnet
        : bscTestnet;
      const contractsChainId = resolvedChain.id as ContractsChainId;
      const batchConfig = BATCH_CONFIGS[contractsChainId]?.http;

      const createTransport = () => {
        if (resolvedChain.id === bscTestnet.id) {
          const transports: Transport[] = [
            ...(HTTP_RPC_URLS[resolvedChain.id]
              ? [
                  http(HTTP_RPC_URLS[resolvedChain.id], {
                    batch: batchConfig,
                    timeout: 20000,
                    retryCount: 0,
                  }),
                ]
              : []),
            http(undefined, {
              batch: batchConfig,
              timeout: 20000,
              retryCount: 0,
            }),
            http('https://bsc-testnet-rpc.publicnode.com', {
              batch: batchConfig,
              timeout: 10000,
              retryCount: 0,
            }),
            http('https://bnb-testnet.api.onfinality.io/public', {
              batch: batchConfig,
              timeout: 10000,
              retryCount: 0,
            }),
          ];

          return fallback(transports, { shouldThrow: shouldStopRpcFallback });
        } else if (resolvedChain.id === bsc.id) {
          return fallback(
            [
              ...(HTTP_RPC_URLS[resolvedChain.id]
                ? [
                    http(HTTP_RPC_URLS[resolvedChain.id], {
                      batch: batchConfig,
                      timeout: 20000,
                      retryCount: 0,
                    }),
                  ]
                : []),
              http('https://bsc-dataseed.bnbchain.org', {
                batch: batchConfig,
                timeout: 20000,
                retryCount: 0,
              }),
              http(undefined, {
                batch: batchConfig,
                timeout: 20000,
                retryCount: 0,
              }),
            ],
            { shouldThrow: shouldStopRpcFallback },
          );
        }

        return http(undefined, { batch: batchConfig });
      };

      const transport = createTransport();
      const publicClient = createPublicClient({
        chain: resolvedChain as Chain,
        transport,
        batch: BATCH_CONFIGS[contractsChainId]?.client,
      });

      sdkInstance = new HertzFlowSDK({
        chainId: contractsChainId,
        rpcUrl: '',
        oracleUrl: `${BSC_DATA_ORACLE_API_BASE_URL}/api`,
        wsRpcUrl:
          (resolvedChain as Chain).rpcUrls.default.webSocket?.[0] ||
          WS_RPC_URLS[resolvedChain.id],
        publicClient: publicClient as HertzFlowSdkConfig['publicClient'],
        tokens: () => fetchStatsTokens(contractsChainId),
        settings: {
          ignoreTimeoutError: true,
          debugMode: isDebugMode(),
        },
      });

      if (cancelled) {
        sdkInstance.destroy();
        return;
      }

      setChain(resolvedChain as Chain);
      setHzSdk(sdkInstance);
    })();

    return () => {
      cancelled = true;
      sdkInstance?.destroy();
    };
  }, [effectiveChainId]);

  hzSdk?.setAccount(userAddress as `0x${string}`);

  // Sync walletClient from Privy wallet's EIP-1193 provider
  useEffect(() => {
    if (!hzSdk || !wallet || !userAddress) return;

    const connectedWallet = wallet as ConnectedWallet;
    if (!connectedWallet.getEthereumProvider) return;

    let cancelled = false;
    connectedWallet.getEthereumProvider().then((provider) => {
      if (cancelled || !provider) return;

      const walletClient = createWalletClient({
        account: userAddress as `0x${string}`,
        chain: chain as Chain,
        transport: custom({
          request: async (args) => provider.request(args),
        }),
      }) as HertzFlowSdkConfig['walletClient'];

      if (walletClient) {
        hzSdk.setWalletClient(walletClient);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hzSdk, wallet, userAddress, chain]);

  return (
    <HzSdkContext.Provider value={hzSdk}>{children}</HzSdkContext.Provider>
  );
};
