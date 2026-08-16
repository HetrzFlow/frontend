'use client';

import { FC, memo, ReactNode, useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@repo/i18n/const';
import { MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import useScrollSyncedTransform from '@/common/hooks/useScrollSyncedTransform';
import MobileSwapPage from '@/components/Swap/MobilePage';
import { ENABLE_SWAP } from '@/constants/common';
import ToasterCus from '../../components/Toaster';
import Content from './Content';
import { LCP_IMAGE_SRC, registerLcpPreload } from './lcpPreload';

interface HeaderProps {
  rightNav?: ReactNode;
  children?: ReactNode;
  genesisStandalone?: boolean;
}

const Header: FC<HeaderProps> = ({
  rightNav,
  children,
  genesisStandalone = false,
}) => {
  registerLcpPreload();

  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const [mobileSwapOpen, setMobileSwapOpen] = useState(false);
  const pathname = usePathname();
  const showMobileSwapPage = ENABLE_SWAP && isMobile && mobileSwapOpen;
  const { isPoolsOverview, isLeaderboardOverview } = useMemo(() => {
    const pathParams = pathname.split('/').filter(Boolean);
    const routeIndex = SUPPORTED_LOCALES.includes(pathParams[0] ?? '') ? 1 : 0;
    const route = pathParams[routeIndex];
    const isOverview = pathParams.length === routeIndex + 1;
    return {
      isPoolsOverview: route === 'pools' && isOverview,
      isLeaderboardOverview: route === 'leaderboard' && isOverview,
    };
  }, [pathname]);

  const scrollBgRef = useScrollSyncedTransform({
    enabled: isLeaderboardOverview && !showMobileSwapPage,
    observeScrollRoot: true,
    schedule: 'raf',
  });

  useEffect(() => {
    setMobileSwapOpen(false);
  }, [isMobile, pathname]);

  useEffect(() => {
    const htmlEle = document.querySelector('html');

    if (isMobile && htmlEle) {
      const fontSize = parseFloat(getComputedStyle(htmlEle).fontSize);
      htmlEle.style.fontSize = `${(16 * 16) / fontSize}px`;
    }

    return () => {
      // reset font size
      if (isMobile && htmlEle) {
        htmlEle.style.fontSize = '16px';
      }
    };
  }, [isMobile]);

  return (
    <>
      <div className="relative">
        {isPoolsOverview && !showMobileSwapPage ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] overflow-hidden md:hidden">
            <video
              src="/trade-static/videos/light.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full rotate-180 object-cover opacity-60 mix-blend-screen"
            />
            <div className="to-bg-1 absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent" />
          </div>
        ) : null}
        {isLeaderboardOverview && !showMobileSwapPage ? (
          <div
            ref={scrollBgRef}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100vw*960/1500)] overflow-hidden will-change-transform md:h-[calc(min(100vw,1195px)*1296/4933)]"
          >
            <div className="relative mx-auto h-full w-full overflow-hidden md:max-w-[1195px]">
              <Image
                src="/trade-static/leaderboard/h5LeaderboardBG.png"
                alt=""
                width={1500}
                height={960}
                sizes="100vw"
                priority
                className="h-full w-full object-cover object-top md:hidden"
              />
              <Image
                src="/trade-static/leaderboard/leaderboardBG.png"
                alt=""
                width={4933}
                height={1296}
                sizes="1195px"
                priority
                className="hidden h-full w-full object-cover object-top md:block"
              />
              <div
                className="pointer-events-none absolute inset-0 md:hidden"
                style={{
                  boxShadow:
                    'inset 0 14px 24px var(--bg-1), inset 0 -40px 42px var(--bg-1), inset 18px 0 28px var(--bg-1), inset -18px 0 28px var(--bg-1)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 hidden md:block"
                style={{
                  boxShadow:
                    'inset 0 24px 40px var(--bg-1), inset 0 -64px 72px var(--bg-1), inset 48px 0 56px var(--bg-1), inset -48px 0 56px var(--bg-1)',
                }}
              />
            </div>
          </div>
        ) : null}
        <Content
          rightNav={rightNav}
          genesisStandalone={genesisStandalone}
          mobileSwapOpen={showMobileSwapPage}
          onMobileSwapClose={() => setMobileSwapOpen(false)}
          onMobileSwapOpen={() => setMobileSwapOpen(true)}
        />
        {/* add hidden LCP element to optimize LCP time*/}
        <div className="pointer-events-none fixed top-0 -z-10 opacity-1">
          <Image
            src={LCP_IMAGE_SRC}
            width={500}
            height={300}
            alt="Favicon"
            fetchPriority="high"
            priority
          />
        </div>
        <div className="relative">
          {showMobileSwapPage ? <MobileSwapPage /> : children}
        </div>
      </div>
      <ToasterCus />
    </>
  );
};

export default memo(Header);
