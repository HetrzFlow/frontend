import { useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import { useHzSdk } from '@/common/chainClient';

const RPC_REQUEST_FAILED_TOAST_ID = 'rpc-request-failed';

function showRpcRequestFailedToast() {
  toast.error('HTTP request failed', { id: RPC_REQUEST_FAILED_TOAST_ID });
}

export const useGasLimits = () => {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;

  const result = useQuery({
    queryKey: ['rest', 'gasLimits', chainId],
    enabled: !!hzSdk && !!chainId,
    queryFn: async () => {
      if (!hzSdk || !chainId) {
        throw new Error('Gas limits query executed before SDK loaded');
      }
      try {
        return await hzSdk.utils.getGasLimits();
      } catch (error) {
        showRpcRequestFailedToast();
        throw error;
      }
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return result;
};

export const useGasPrice = () => {
  const hzSdk = useHzSdk();
  const chainId = hzSdk?.chainId;

  const result = useQuery({
    queryKey: ['rest', 'gasPrice', chainId],
    enabled: !!hzSdk && !!chainId,
    queryFn: async () => {
      if (!hzSdk || !chainId) {
        throw new Error('Gas price query executed before SDK loaded');
      }
      try {
        return await hzSdk.utils.getGasPrice();
      } catch (error) {
        showRpcRequestFailedToast();
        throw error;
      }
    },
    refetchOnMount: false,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  return result;
};
