'use client';

import { FC, memo, useEffect, useRef, useState } from 'react';

import {
  ArrowLeftRightIcon,
  cn,
  HzLPIcon,
  MEDIA_SIZES,
  PieChartIcon,
  TabsActiveBar,
  TradeIcon,
  useMediaQuery,
} from '@repo/ui';
import { useNavItems } from '../../hooks/useNavItems';
import NavItem from './NavItem';

interface NavProps {
  activeItem?: string;
  clientRoutes: string[];
  className?: string;
}

const Nav: FC<NavProps> = ({ activeItem = '', clientRoutes, className }) => {
  const activeTabRef = useRef<
    Record<string, (HTMLDivElement & HTMLAnchorElement) | null>
  >({});
  const [activeEle, setActiveEle] = useState<
    (HTMLDivElement & HTMLAnchorElement) | null | undefined
  >(null);
  const [clickItem, setClickItem] = useState(activeItem || '');
  const navItems = useNavItems();

  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  return (
    <>
      <div
        className={cn(
          'bottom-0 left-0 mt-[8px] flex max-md:fixed max-md:z-40 md:-ml-0.5',
          className,
        )}
      >
        <div
          className="bg-secondary h-[48px] w-13 shrink-0 grow-0 opacity-90 max-md:hidden"
          style={{
            clipPath: `path("M 0 48 C 11.918 48 22.7 40.9442 27.484 30.0246 L 35.377 11.9836 C 38.562 4.7039 45.754 0 52 0 H 54 V 50 H 0 Z")`,
          }}
        />
        <div className="text-muted-foreground bg-secondary max-md:bg-bg-4 relative z-1 flex h-[48px] w-screen shrink-0 grow-0 items-center justify-between gap-10 px-1 font-medium opacity-90 max-md:z-10 max-md:m-4 max-md:h-[56px] max-md:w-[calc(100vw-var(--spacing)*8)] max-md:gap-2 max-md:rounded-full max-md:px-[28px] max-md:py-3 max-md:opacity-100 max-md:shadow-[0_10px_30px_0_rgba(0,0,0,0.15)] md:w-auto md:justify-start">
          <NavItem
            ref={(el) => {
              activeTabRef.current['trade'] = el;
              if (clickItem === 'trade') {
                setActiveEle(el);
              }
            }}
            hideActiveBg={!!activeEle}
            link={navItems.trade.link}
            title={navItems.trade.label}
            icon={<TradeIcon size={20} className="md:hidden" />}
            active={activeItem === 'trade'}
            isInternalLink={clientRoutes.includes('trade')}
            onClick={() => {
              setClickItem('trade');
              setActiveEle(activeTabRef.current.trade);
            }}
          />
          <NavItem
            ref={(el) => {
              activeTabRef.current['hzlp'] = el;
              if (clickItem === 'hzlp') {
                setActiveEle(el);
              }
            }}
            hideActiveBg={!!activeEle}
            link={navItems.hzlp.link}
            title={navItems.hzlp.label}
            icon={<HzLPIcon size={20} className="md:hidden" />}
            active={activeItem === 'hzlp'}
            isInternalLink={clientRoutes.includes('hzlp')}
            onClick={() => {
              setClickItem('hzlp');
              setActiveEle(activeTabRef.current.hzlp);
            }}
          />
          <NavItem
            ref={(el) => {
              activeTabRef.current['dashboard'] = el;
              if (clickItem === 'dashboard') {
                setActiveEle(el);
              }
            }}
            hideActiveBg={!!activeEle}
            link={navItems.dashboard.link}
            title={navItems.dashboard.label}
            icon={<PieChartIcon size={20} className="md:hidden" />}
            active={activeItem === 'dashboard'}
            isInternalLink={clientRoutes.includes('dashboard')}
            onClick={() => {
              setClickItem('dashboard');
              setActiveEle(activeTabRef.current.dashboard);
            }}
          />
          <NavItem
            ref={(el) => {
              activeTabRef.current['swap'] = el;
              if (clickItem === 'swap') {
                setActiveEle(el);
              }
            }}
            hideActiveBg={!!activeEle}
            link={navItems.swap.link}
            title={navItems.swap.label}
            icon={<ArrowLeftRightIcon size={20} className="md:hidden" />}
            active={activeItem === 'swap'}
            isInternalLink={clientRoutes.includes('swap')}
            className="md:hidden"
            onClick={() => {
              setClickItem('swap');
              setActiveEle(activeTabRef.current.swap);
            }}
          />
          <TabsActiveBar
            className={cn(
              'bg-bg-5 max-md:bg-bg-3-h5 bottom-2 -z-1 h-8 rounded-full max-md:bottom-[4px] max-md:h-[48px]',
              clickItem ? 'visible' : 'invisible',
              clickItem === 'swap' ? 'md:invisible' : '',
            )}
            widthCompensation={isMobile ? 48 : 32}
            xOffset={isMobile ? -24 : -16}
            activeTabEle={activeEle as HTMLButtonElement | null | undefined}
          />
        </div>
        <div
          className="bg-secondary h-[48px] w-13 shrink-0 grow-0 opacity-90 max-md:hidden"
          style={{
            clipPath: `path("M -2 50 V 0 H 0 C 7.7 0 14.7 4.4166 18 11.3576 L 30.15 36.6424 C 33.48 43.5834 40.49 48 48.2 48 V 50 Z")`,
          }}
        />
      </div>
    </>
  );
};

export default memo(Nav);
