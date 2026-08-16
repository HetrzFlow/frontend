import { FC, ReactNode, useRef, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { Button, Label, LoaderCircleIcon, Switch } from '@repo/ui';
import { useKlineStore } from '@/stores/trade/kline';
import { useClaimStore } from '../Claim/store';
import { useOpenOrdersStore } from '../openOrders/store';
import { usePositionsStore } from '../positions/store';
import { useOrdersStore } from '../store';

interface OperationsProps {
  onCloseAll?: () => void;
  onCancelAll?: () => void;
  onClaimAll?: () => void;
  count?: number;
  extra?: ReactNode;
}

const Operations: FC<OperationsProps> = ({
  onCancelAll,
  onCloseAll,
  onClaimAll,
  count = 0,
  extra,
}) => {
  const { t } = useLingui();
  const [showPositions, setShowPositions] = useKlineStore(
    useShallow((state) => [state.showPositions, state.setShowPositions]),
  );
  const [onlyShowCurrentInst, setOnlyShowCurrentInst] = useOrdersStore(
    useShallow((state) => [
      state.onlyShowCurrentInst,
      state.setOnlyShowCurrentInst,
    ]),
  );
  const {
    processingId: claimProcessingId,
    setProcessingId: setClaimProcessingId,
  } = useClaimStore();
  const [
    openOrdersProcessingItemId,
    openOrdersIsProcessingAll,
    setOpenOrdersSetProcessingAll,
  ] = useOpenOrdersStore(
    useShallow((state) => [
      state.processingItemId,
      state.isProcessingAll,
      state.setProcessingAll,
    ]),
  );
  const [
    positionsProcessingItemIds,
    positionsIsClosingAll,
    setPositionsSetClosingAll,
  ] = usePositionsStore(
    useShallow((state) => [
      state.processingItemIds,
      state.isClosingAll,
      state.setClosingAll,
    ]),
  );

  // Combined processing state - if either is processing, disable all
  const isProcessing =
    !!claimProcessingId ||
    !!openOrdersProcessingItemId ||
    openOrdersIsProcessingAll ||
    positionsProcessingItemIds.size > 0 ||
    positionsIsClosingAll;

  // Use ref to keep function reference stable
  const onClaimAllRef = useRef(onClaimAll);
  onClaimAllRef.current = onClaimAll;

  const onCancelAllRef = useRef(onCancelAll);
  onCancelAllRef.current = onCancelAll;

  const handleClaimAll = useCallback(async () => {
    if (claimProcessingId) return;
    setClaimProcessingId('claim-all');
    try {
      await onClaimAllRef.current?.();
    } finally {
      setClaimProcessingId(null);
    }
  }, [claimProcessingId, setClaimProcessingId]);

  const handleCancelAll = useCallback(async () => {
    if (openOrdersProcessingItemId || openOrdersIsProcessingAll) return;
    setOpenOrdersSetProcessingAll(true);
    try {
      await onCancelAllRef.current?.();
    } finally {
      setOpenOrdersSetProcessingAll(false);
    }
  }, [
    openOrdersProcessingItemId,
    openOrdersIsProcessingAll,
    setOpenOrdersSetProcessingAll,
  ]);

  const handleCloseAll = useCallback(async () => {
    if (positionsProcessingItemIds.size > 0 || positionsIsClosingAll) return;
    setPositionsSetClosingAll(true);
    try {
      await onCloseAll?.();
    } finally {
      setPositionsSetClosingAll(false);
    }
  }, [
    positionsProcessingItemIds,
    positionsIsClosingAll,
    setPositionsSetClosingAll,
    onCloseAll,
  ]);
  return (
    <div className="max-md:bg-bg-1-h5 flex items-center gap-3 border-b px-4 py-3 max-md:sticky max-md:top-[47px] max-md:z-10">
      <Label className="text-t-270 z-1 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-normal">
        {t`Chart Positions`}
        <Switch
          aria-label={t`Chart Positions`}
          checked={showPositions}
          onCheckedChange={(checked) => setShowPositions(checked)}
        />
      </Label>
      <Label className="text-t-270 z-1 flex shrink-0 cursor-pointer items-center gap-2 text-xs font-normal">
        {t`Hide Others`}
        <Switch
          aria-label={t`Hide Others`}
          checked={onlyShowCurrentInst}
          onCheckedChange={(checked) => setOnlyShowCurrentInst(checked)}
        />
      </Label>
      <div className="ml-auto flex h-4 items-center gap-3">
        {extra}
        {onCloseAll && (
          <Button
            variant="link"
            size="sm"
            disabled={!count || isProcessing}
            className="p-0 hover:no-underline"
            onClick={handleCloseAll}
          >
            {positionsIsClosingAll ? (
              <>
                <LoaderCircleIcon size={14} className="animate-spin" />
                {t`Closing`}
              </>
            ) : count ? (
              t`Close all (${count})`
            ) : (
              t`Close all`
            )}
          </Button>
        )}
        {onCancelAll && (
          <Button
            variant="link"
            size="sm"
            disabled={!count || isProcessing}
            className="p-0 hover:no-underline"
            onClick={handleCancelAll}
          >
            {openOrdersIsProcessingAll ? (
              <>
                <LoaderCircleIcon size={14} className="animate-spin" />
                {t`Cancelling`}
              </>
            ) : count ? (
              t`Cancel all (${count})`
            ) : (
              t`Cancel all`
            )}
          </Button>
        )}
        {onClaimAll && (
          <Button
            variant="link"
            size="sm"
            disabled={!count || isProcessing}
            className="!p-0 hover:no-underline"
            onClick={handleClaimAll}
          >
            {claimProcessingId === 'claim-all' ? (
              <>
                <LoaderCircleIcon size={14} className="animate-spin" />
                {t`Claiming`}
              </>
            ) : (
              t`Claim all`
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Operations;
