import type { Address, PublicClient, WalletClient } from "viem";

import type { ContractsChainId } from "configs/chains";

import type { MarketSdkConfig } from "./markets";
import type { Token, TokensData } from "./tokens";

export type TokensConfig =
  | Record<string, Partial<Token>>
  | (() => Promise<TokensData>);

export interface HertzFlowSdkConfig {
  /** Chain ID */
  chainId: ContractsChainId;
  /** Account's address */
  account?: Address;
  /** Blockchain RPC URL. Ignored when publicClient is provided. */
  rpcUrl: string;
  /** Optional WebSocket RPC URL used by event subscriptions. */
  wsRpcUrl?: string;
  /** Oracle API base URL used by SDK price-fetching methods. */
  oracleUrl: string;

  /** Custom viem's public and private client */
  publicClient?: PublicClient;
  walletClient?: WalletClient;

  /**
   * Token configuration overrides keyed by address, or an async metadata source
   * that adds newly listed addresses missing from the SDK configuration.
   */
  tokens?: TokensConfig;
  /** Markets override configurations */
  markets?: Record<string, Partial<MarketSdkConfig>>;

  externalSwap?: {
    /** Peach API base URL override. */
    apiBaseUrl?: string;
    /** Peach API request timeout. */
    requestTimeoutMs?: number;
    /** Router allowlist override used to validate quote transactions. */
    trustedRouterAddresses?: Address[];
  };

  settings?: {
    uiFeeReceiverAccount?: string;
    ignoreTimeoutError?: boolean;
    /** SDK internal console logging is enabled by default. Set to false to disable it. */
    debugMode?: boolean;
  };
}
