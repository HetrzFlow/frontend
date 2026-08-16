import { FC, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { Button, LoaderCircleIcon } from '@repo/ui';
import { useMarketIsDisabled } from '@/common';
import MarketIsClosedTooltip from '@/components/MarketIsClosedTooltip';

import { usePositionsStore } from '../store';

interface CloseProps {
  id: string;
  marketAddress: string;
  onClose: (id: string) => void;
}

const Close: FC<CloseProps> = ({ id, marketAddress, onClose }) => {
  const { t } = useLingui();
  const marketIsDisabled = useMarketIsDisabled(marketAddress);
  const [processingItemIds, isClosingAll] = usePositionsStore(
    useShallow((state) => [state.processingItemIds, state.isClosingAll]),
  );

  const isThisItemProcessing = processingItemIds.has(id);
  const isAnyProcessing = processingItemIds.size > 0;
  const isDisabled = marketIsDisabled || isThisItemProcessing || isClosingAll || isAnyProcessing;

  const handleClose = useCallback(() => {
    if (isDisabled) return;
    onClose(id);
  }, [id, isDisabled, onClose]);

  return (
    <MarketIsClosedTooltip marketAddress={marketAddress}>
      <Button
        disabled={isDisabled}
        size="sm"
        variant="accent"
        className="h-6"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        {isThisItemProcessing ? (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {t`Closing`}
          </>
        ) : (
          t`Close`
        )}
      </Button>
    </MarketIsClosedTooltip>
  );
};

export default Close;
