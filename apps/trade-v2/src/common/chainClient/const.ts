import { bsc, bscTestnet } from 'viem/chains';

const enablePrivateRpc = process.env.NEXT_PUBLIC_ENABLE_PRIVATE_RPC;

const BNB_MAINNET_RPC_HTTP = '';
const BNB_MAINNET_RPC_WS =
  enablePrivateRpc === 'true'
    ? (process.env.NEXT_PUBLIC_BNB_MAINNET_RPC_WS ?? '')
    : '';
const BNB_TESTNET_RPC_HTTP = '';
const BNB_TESTNET_RPC_WS =
  enablePrivateRpc === 'true'
    ? (process.env.NEXT_PUBLIC_BNB_TESTNET_RPC_WS ?? '')
    : '';

export const WS_RPC_URLS: Record<number, string> = {
  [bsc.id]: BNB_MAINNET_RPC_WS,
  [bscTestnet.id]: BNB_TESTNET_RPC_WS,
};

export const HTTP_RPC_URLS: Record<number, string> = {
  [bsc.id]: BNB_MAINNET_RPC_HTTP,
  [bscTestnet.id]: BNB_TESTNET_RPC_HTTP,
};

export const SUPPORTED_CHAIN_IDS: number[] = [bsc.id, bscTestnet.id];
