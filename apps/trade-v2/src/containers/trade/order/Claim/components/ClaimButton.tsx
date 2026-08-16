import { useRef, useCallback, FC } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { msg } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { i18n } from '@repo/i18n/client';

import { Button, LoaderCircleIcon } from '@repo/ui';

import { useHzSdk } from '@/common/chainClient';
import { useClaim } from '../hooks';
import { useClaimStore } from '../store';
import type { ClaimTableDataType } from '../type';

interface ClaimButtonProps {
  data: ClaimTableDataType;
  claimedUsd?: string;
}

const ClaimButton: FC<ClaimButtonProps> = ({ data, claimedUsd }) => {
  const hzSdk = useHzSdk();

  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';
  const txHash = data.kind === 'history' ? data.tx_hash : undefined;
  const id = data.id;
  const claimType = data.kind === 'pending' ? data.claim_type : undefined;
  const [processingId, setProcessingId] = useClaimStore(
    useShallow((state) => [state.processingId, state.setProcessingId]),
  );
  const { mutateAsync: onClaim } = useClaim();

  // Use ref to keep function reference stable
  const onClaimRef = useRef(onClaim);
  onClaimRef.current = onClaim;

  const handleClaim = useCallback(async () => {
    if (data.kind !== 'pending' || processingId || !claimType) return;
    setProcessingId(id);
    try {
      await onClaimRef.current({
        claimType,
        claimedUsd,
        marketAddress: data.marketAddress,
        tokenAddress: data.tokenAddress,
        timeKey: data.timeKey,
      });
    } finally {
      setProcessingId(null);
    }
  }, [processingId, setProcessingId, id, claimType, data, claimedUsd]);

  if (data.kind === 'history') {
    if (txHash && explorerHost) {
      return (
        <a
          href={`${explorerHost}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <Button size="sm" variant="accent" className="h-6">
            {i18n._(msg`Detail`)}
          </Button>
        </a>
      );
    }

    return null;
  }

  return (
    <Button
      size="sm"
      variant="accent"
      className="h-6"
      disabled={!!processingId}
      onClick={handleClaim}
    >
      {processingId === id ? (
        <>
          <LoaderCircleIcon size={14} className="animate-spin" />
          {i18n._(msg`Claiming`)}
        </>
      ) : (
        i18n._(msg`Claim`)
      )}
    </Button>
  );
};

export default ClaimButton;
