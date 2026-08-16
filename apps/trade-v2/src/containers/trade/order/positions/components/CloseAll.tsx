import { FC, useRef, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { Button, LoaderCircleIcon } from '@repo/ui';
import { Position, useInstStore, useMarketsConfigs } from '@/common';
import { marketIsOpen } from '@/hooks/useMarketsStats';

import { usePositionsStore } from '../store';

interface CloseAllProps {
  positions: Position[];
  onCloseAll: () => void;
}

const CloseAll: FC<CloseAllProps> = ({ positions, onCloseAll }) => {
  const { t } = useLingui();
  const insts = useInstStore((state) => state.getInsts());
  const { data: marketsConfigs } = useMarketsConfigs({
    markets: positions.map((position) => insts[position.marketAddress]),
  });
  const [processingItemIds, isClosingAll, setClosingAll] = usePositionsStore(
    useShallow((state) => [
      state.processingItemIds,
      state.isClosingAll,
      state.setClosingAll,
    ]),
  );

  const filterPositions = positions.filter(
    (v) =>
      marketIsOpen(insts[v.marketAddress]) &&
      !marketsConfigs?.[v.marketAddress]?.isDisabled,
  );
  const orderCount = filterPositions.length;
  const isDisabled = !orderCount || isClosingAll || processingItemIds.size > 0;

  // Use ref to keep function reference stable
  const onCloseAllRef = useRef(onCloseAll);
  onCloseAllRef.current = onCloseAll;

  const handleCloseAll = useCallback(async () => {
    if (isClosingAll || processingItemIds.size > 0) return;
    setClosingAll(true);
    try {
      await onCloseAllRef.current();
    } finally {
      setClosingAll(false);
    }
  }, [isClosingAll, processingItemIds, setClosingAll]);

  return (
    <Button
      size="xs"
      variant="accentLight"
      disabled={isDisabled}
      onClick={handleCloseAll}
    >
      {isClosingAll ? (
        <>
          <LoaderCircleIcon size={14} className="animate-spin" />
          {t`Closing`}
        </>
      ) : orderCount ? (
        t`Close all (${orderCount})`
      ) : (
        t`Close all`
      )}
    </Button>
  );
};

export default CloseAll;
