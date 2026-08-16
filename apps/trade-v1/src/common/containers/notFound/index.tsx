'use client';

import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Button } from '@repo/ui';
import { useNavItems } from '../../hooks/useNavItems';
import Footer from '../footer';
import Logo from '../header/Logo';
const NotFound = ({
  showHeader,
  showFooter,
}: {
  showHeader?: boolean;
  showFooter?: boolean;
}) => {
  const navItems = useNavItems();
  return (
    <>
      {showHeader && (
        <header className="mt-[16px] mb-[14px] px-4">
          <Logo />
        </header>
      )}
      <main className="notFound-page flex h-[calc(100dvh-90px)] flex-col items-center justify-center gap-10 max-md:h-[calc(100dvh-48px)]">
        <div className="relative overflow-hidden">
          <div className="bg-accent/10 absolute top-1/2 -z-1 h-full w-full -translate-y-1/2"></div>
          <video
            height="100%"
            loop
            autoPlay
            preload="auto"
            muted
            playsInline
            className={
              'absolute top-1/2 -z-1 h-full -translate-y-1/2 object-cover mix-blend-darken dark:mix-blend-lighten'
            }
          >
            <source
              src={`${process.env.NEXT_PUBLIC_HOME_URL || ''}/home-static/banner.mp4`}
              type="video/mp4"
            />
            {i18n._(msg`Your browser does not support the video tag.`)}
          </video>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 328 136"
            fill="none"
          >
            <defs>
              <mask id="holeMask">
                <rect width="100%" height="110%" fill="white" />
                <path
                  d="M162.729 0C185.528 0.000178643 212.128 15.3998 212.128 47.5996V87.5996C212.128 119.799 185.528 135.199 162.729 135.199C139.929 135.199 113.328 119.8 113.328 87.5996V47.5996C113.328 15.3996 139.929 0 162.729 0ZM74.2002 6.59961L27.4004 79.7998V83.7998H57V61.1992H87V83.7998H101.4V110.6H87V132.6H57V110.6H0V69.3994L40.4004 2.59961H74.2002V6.59961ZM300.372 6.59961L253.572 79.7998V83.7998H283.172V61.1992H313.172V83.7998H327.572V110.6H313.172V132.6H283.172V110.6H226.172V69.3994L266.572 2.59961H300.372V6.59961ZM162.729 29.3994C151.729 29.3994 143.528 37.3996 143.528 48.5996V86.5996C143.528 97.7996 151.729 105.8 162.729 105.8C173.728 105.8 181.928 97.7995 181.928 86.5996V48.5996C181.928 37.3997 173.728 29.3996 162.729 29.3994Z"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="110%"
              fill="var(--background)"
              mask="url(#holeMask)"
            />
          </svg>
        </div>
        <div className="text-t-270 text-base font-medium">
          {i18n._(msg`Sorry! The page you are looking for cannot be found.`)}
        </div>
        <a href={navItems.trade.link} rel="noopener noreferrer">
          <Button className="h-[54px] rounded-full bg-black px-10 text-white hover:bg-black hover:opacity-80 dark:bg-white dark:text-black dark:hover:bg-white">
            {i18n._(msg`Return to Trading Page`)}
          </Button>
        </a>
      </main>
      {showFooter && <Footer />}
    </>
  );
};

export default NotFound;
