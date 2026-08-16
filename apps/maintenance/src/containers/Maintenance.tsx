'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLingui } from '@lingui/react/macro';
import { useNavItems } from '@repo/common/hooks';
import { Button, cn } from '@repo/ui';

const Maintenance = () => {
  const { t } = useLingui();
  const { resolvedTheme } = useTheme();
  const [isHydrated, setIsHydrated] = useState(false);

  const { trade } = useNavItems();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated)
    return (
      <main className="mb-4 flex h-[calc(100dvh-112px)] flex-col items-center justify-center gap-10"></main>
    );

  const isDark = resolvedTheme === 'dark';

  return (
    <main className="mb-4 flex h-[calc(100dvh-112px)] flex-col items-center justify-center gap-10">
      <div className="h-60">
        <video
          width="426"
          height="240"
          loop
          autoPlay
          preload="metadata"
          poster={isDark ? '/bg-dark.webp' : '/bg-light.webp'}
          muted
          playsInline
          controls={false}
          className={cn('relative h-full w-full object-bottom')}
        >
          <source
            src={isDark ? '/bg-dark.mp4' : '/bg-light.mp4'}
            type="video/mp4"
          />
          {t`Your browser does not support the video tag.`}
        </video>
      </div>
      <div className="text-t-270 flex max-w-100 flex-col gap-3 text-center text-base font-medium">
        <h2 className="text-t-1100 text-[calc(var(--spacing)*8)]/tight font-semibold">{t`We Will Be Back Soon!`}</h2>
        {t`This page is temporarily down for maintenance. Please wait for a moment and try again.`}
      </div>
      {/* refresh page */}
      <a href={trade.link || ''} rel="noopener noreferrer">
        <Button variant="accent" className="rounded-xl px-10">
          {t`Refresh Page`}
        </Button>
      </a>
    </main>
  );
};

export default Maintenance;
