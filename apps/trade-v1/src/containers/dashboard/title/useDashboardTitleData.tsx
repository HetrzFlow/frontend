import { useWalletStore } from '@/common';
import { useCheckpoint } from '@/hooks/useCheckpoint';

export const CHECKPOINTS_SUFFIX = '/checkpoints';

export const useDashboardTitleData = () => {
  const { checkpoint, checkpointDetail, isLoading } = useCheckpoint({
    enableRealtime: true,
  });

  const explorerHost = useWalletStore((state) => state.getExplorerHost());
  return {
    checkpoint,
    checkpointDetail,
    isLoading,
    explorerHost,
  };
};
