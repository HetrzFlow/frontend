import { useEffect, useState, useRef, useCallback } from 'react';
import { Checkpoint } from '@mysten/sui/client';
import { useHzSdk } from '@/common';

export const useCheckpoint = (options?: {
  enableRealtime?: boolean;
  pollingInterval?: number;
}) => {
  const { enableRealtime = false, pollingInterval = 5000 } = options || {};
  const hzSdk = useHzSdk();
  const [checkpoint, setCheckpoint] = useState<string>('');
  const [checkpointDetail, setCheckpointDetail] = useState<Checkpoint>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCheckpoint = useCallback(async () => {
    try {
      setError(null);
      const data = await hzSdk.RpcModule.getLatestCheckpointSequenceNumber();
      setCheckpoint(data);
    } catch (error) {
      console.error('Failed to fetch checkpoint:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [hzSdk.RpcModule]);

  const fetchCheckpointDetail = useCallback(
    async (checkpointId: string) => {
      try {
        const data = await hzSdk.RpcModule.getCheckpoint({
          id: checkpointId,
        });
        setCheckpointDetail(data);
      } catch (error) {
        console.error('Failed to fetch checkpoint detail:', error);
        setError(error as Error);
      }
    },
    [hzSdk.RpcModule],
  );

  useEffect(() => {
    fetchCheckpoint();
  }, [fetchCheckpoint]);

  useEffect(() => {
    if (!checkpoint) return;
    fetchCheckpointDetail(checkpoint);
  }, [checkpoint, fetchCheckpointDetail]);

  useEffect(() => {
    if (!enableRealtime || pollingInterval <= 0) return;

    intervalRef.current = setInterval(fetchCheckpoint, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enableRealtime, pollingInterval, fetchCheckpoint]);

  return {
    checkpoint,
    checkpointDetail,
    isLoading,
    error,
    refetch: fetchCheckpoint,
  };
};
