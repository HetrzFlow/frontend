import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

// fetch countdown
export const useFetchCountdown = ({
  refetch,
  isFetching,
}: {
  refetch: () => void;
  isFetching?: boolean;
}) => {
  const [fetchPxStatus, setFetchPxStatus] = useState<
    'initial' | 'fetching' | 'done'
  >('initial');
  const refetchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (fetchPxStatus === 'initial' && isFetching) {
      setFetchPxStatus('fetching');
    }
    if (['initial', 'fetching'].includes(fetchPxStatus) && !isFetching) {
      setFetchPxStatus('done');
    }
  }, [isFetching, fetchPxStatus]);

  useEffect(() => {
    if (refetchTimer.current) {
      clearTimeout(refetchTimer.current);
    }

    if (fetchPxStatus === 'done') {
      refetchTimer.current = setTimeout(() => {
        setFetchPxStatus('initial');
        refetch();
      }, 20000);
    }

    return () => {
      if (refetchTimer.current) {
        clearTimeout(refetchTimer.current);
      }
    };
  }, [fetchPxStatus, refetch]);

  return [fetchPxStatus, setFetchPxStatus] as [
    'initial' | 'fetching' | 'done',
    Dispatch<SetStateAction<'initial' | 'fetching' | 'done'>>,
  ];
};
