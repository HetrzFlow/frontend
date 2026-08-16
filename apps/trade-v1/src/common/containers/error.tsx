'use client';

import { useEffect, useState } from 'react';
import { useLingui } from '@lingui/react/macro';

const maxRetries = 1;

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { t } = useLingui();
  const [retryCount, setRetryCount] = useState(() => {
    const count = Number(sessionStorage.getItem(`error-retry:trade`)) || 0;
    return count;
  });

  useEffect(() => {
    if (retryCount < maxRetries) {
      const nextCount = retryCount + 1;
      sessionStorage.setItem(`error-retry:trade`, String(nextCount));
      setRetryCount(nextCount);
      setTimeout(() => {
        reset();
      }, 200);
    }
  }, [retryCount, reset]);

  if (retryCount < maxRetries) {
    return null;
  }

  const isLoadChunkError =
    error.message.includes('Loading chunk') ||
    error.message.includes('load chunk');

  return (
    <div className="flex h-[calc(100dvh-90px)] flex-col items-center justify-center gap-5 max-md:h-[calc(100dvh-48px)]">
      <h2>
        {isLoadChunkError
          ? t`A new version is available. Please refresh the page to continue.`
          : `${t`Client Error`}: ${error.message}`}
      </h2>
      <button
        className="bg-accent text-accent-foreground mt-4 rounded-lg px-6 py-2"
        onClick={() => {
          sessionStorage.setItem('error-retry:trade', '0');
          if (isLoadChunkError) {
            window.location.reload();
          } else {
            setRetryCount(0);
            reset();
          }
        }}
      >
        {isLoadChunkError ? t`Refresh` : t`Retry`}
      </button>
    </div>
  );
}
