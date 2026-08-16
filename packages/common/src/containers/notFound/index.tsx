'use client';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Logo, Footer } from '@repo/common/components';
import { Button, cn } from '@repo/ui';
import { useHydrated } from '../../hooks';
import { useNavItems } from '../../hooks/useNavItems';

const NotFound = ({
  showHeader,
  showFooter,
  className,
  theme,
}: {
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  theme?: string;
}) => {
  const navItems = useNavItems();
  const isDark = (theme || 'dark') === 'dark';

  const isHydrated = useHydrated();

  if (!isHydrated)
    return (
      <main
        className={cn(
          'notFound-page flex min-h-screen flex-col items-center justify-center gap-10 bg-bg-1',
          className,
        )}
      />
    );

  return (
    <div className="flow-root min-h-screen bg-bg-1">
      {showHeader && (
        <header className="mt-[16px] mb-[14px] px-4">
          <Logo />
        </header>
      )}
      <main
        className={cn(
          'notFound-page flex h-[calc(100dvh-90px)] flex-col items-center justify-center gap-10 max-md:h-[calc(100dvh-48px)]',
          className,
        )}
      >
        <div className="relative overflow-hidden">
          {!isDark && (
            <video
              height={200}
              width={485}
              loop
              autoPlay
              preload="auto"
              poster={`${process.env.NEXT_PUBLIC_HOME_URL || ''}/home-static/404-light.webp`}
              muted
              playsInline
              className={'h-[200px] object-cover'}
            >
              <source
                src={`${process.env.NEXT_PUBLIC_HOME_URL || ''}/home-static/404-light.mp4`}
                type="video/mp4"
              />
              {i18n._(msg`Your browser does not support the video tag.`)}
            </video>
          )}
          {isDark && (
            <video
              height={200}
              width={485}
              loop
              autoPlay
              preload="auto"
              poster={`${process.env.NEXT_PUBLIC_HOME_URL || ''}/home-static/404.webp`}
              muted
              playsInline
              className={'h-[200px] object-cover'}
            >
              <source
                src={`${process.env.NEXT_PUBLIC_HOME_URL || ''}/home-static/404.mp4`}
                type="video/mp4"
              />
              {i18n._(msg`Your browser does not support the video tag.`)}
            </video>
          )}
        </div>
        <div className="text-t-270 text-base font-medium">
          {i18n._(msg`Sorry! The page you are looking for cannot be found.`)}
        </div>
        <a href={navItems.trade.link} rel="noopener noreferrer">
          <Button variant="accent" className="rounded-xl px-10">
            {i18n._(msg`Return to Trading Page`)}
          </Button>
        </a>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default NotFound;
