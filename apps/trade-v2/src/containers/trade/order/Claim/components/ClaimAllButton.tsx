import { useRef, useCallback, FC } from 'react';
import { msg } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { i18n } from '@repo/i18n/client';

import { Button, LoaderCircleIcon } from '@repo/ui';

import { useClaim } from '../hooks';
import { useClaimStore } from '../store';

interface ClaimAllButtonProps {
  count: number;
  hasTxHash: boolean;
  claimedUsd?: string;
}

const ClaimAllButton: FC<ClaimAllButtonProps> = ({
  count,
  hasTxHash,
  claimedUsd,
}) => {
  const [processingId, setProcessingId] = useClaimStore(
    useShallow((state) => [state.processingId, state.setProcessingId]),
  );
  const { mutateAsync: onClaim } = useClaim();

  // Use ref to keep function reference stable
  const onClaimRef = useRef(onClaim);
  onClaimRef.current = onClaim;

  const handleClaimAll = useCallback(async () => {
    if (processingId) return;
    setProcessingId('claim-all');
    try {
      await onClaimRef.current({ claimedUsd });
    } finally {
      setProcessingId(null);
    }
  }, [processingId, setProcessingId, claimedUsd]);

  return (
    <Button
      size="xs"
      variant="accentLight"
      disabled={!count || hasTxHash || !!processingId}
      onClick={handleClaimAll}
    >
      {processingId === 'claim-all' ? (
        <>
          <LoaderCircleIcon size={14} className="animate-spin" />
          {i18n._(msg`Claiming`)}
        </>
      ) : (
        i18n._(msg`Claim all`)
      )}
    </Button>
  );
};

export default ClaimAllButton;
