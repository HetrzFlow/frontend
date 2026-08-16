import { useQuery } from '@repo/lib/queryClient';
import { post } from '@repo/lib/rest';

// measure sui rpc latency
export async function measureSuiRpcLatency(
  rpcUrl: string,
  signal?: AbortSignal,
) {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'sui_getLatestCheckpointSequenceNumber',
    params: [],
  };

  const start = performance.now();
  await post(rpcUrl, payload, {
    timeout: 3000,
    signal,
  });
  // Performance API
  const entries = performance.getEntriesByType(
    'resource',
  ) as PerformanceResourceTiming[];
  const entry = entries.find((e) => e.name.includes(rpcUrl.split(':')[1]!));

  return entry && entry.requestStart
    ? entry.responseEnd - entry.requestStart
    : performance.now() - start;
}

// measure sui rpc latency hook
export const useSuiRPCLatency = (rpcUrl?: string, refetchInterval?: number) => {
  return useQuery({
    queryKey: ['suiRPC', 'latency', rpcUrl],
    enabled: !!rpcUrl,
    queryFn: async () => {
      await new Promise((resolve) => {
        setTimeout(
          () => {
            resolve('');
          },
          Math.floor(Math.random() * 500),
        );
      });

      // when offline, do not send request
      if (!navigator.onLine) {
        return undefined;
      }

      return measureSuiRpcLatency(rpcUrl!);
    },
    refetchInterval: refetchInterval || false,
    retry: 1,
  });
};
