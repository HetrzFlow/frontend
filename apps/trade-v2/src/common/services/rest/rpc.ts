import { withTimeout } from 'viem';
import type { HertzFlowSDK } from '@hertzflow/sdk-v2';

const RPC_LATENCY_TIMEOUT = 5_000;

// measure evm rpc latency
export async function measureEvmRpcLatency(
  hzSdk: HertzFlowSDK,
): Promise<number> {
  const start = performance.now();
  await withTimeout(() => hzSdk.publicClient.getBlockNumber(), {
    timeout: RPC_LATENCY_TIMEOUT,
    errorInstance: new Error('RPC latency check timed out'),
  });
  const end = performance.now();
  return end - start;
}
