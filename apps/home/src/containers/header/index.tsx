'use client';

import { FC, useEffect, useState } from 'react';
import { LocaleSwitch, Logo } from '@repo/common/components';
import { cn } from '@repo/ui';
import LaunchAppBtn from '@/components/LaunchAppBtn';
import SocialLinks from './SocialLinks';

const Header: FC<{ scrollThreshold?: number }> = ({ scrollThreshold }) => {
  const [isScrolledFullScreen, setIsScrolledFullScreen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledFullScreen(window.scrollY > window.innerHeight);
      setIsScrolled(
        window.scrollY > (scrollThreshold ?? window.innerHeight / 2),
      );
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 z-100 flex w-dvw justify-center bg-transparent px-20 py-4 max-md:px-4',
        isScrolled ? 'backdrop-blur-xl' : '',
      )}
    >
      <div className="flex w-full max-w-[1280px] items-center">
        <Logo iconSize={32} textIconClassName="text-t-1100!" project="home" />
        <nav aria-label="Page sections">
          <a href="#trade" className="sr-only">
            Trade
          </a>
          <a href="#earn" className="sr-only">
            Earn
          </a>
          <a href="#developers" className="sr-only">
            Developers
          </a>
        </nav>
        <SocialLinks isVisible={!isScrolledFullScreen} />
        <LaunchAppBtn />
        <LocaleSwitch
          triggerClassName="bg-t-1100/10 hover:text-t-270 hover:bg-t-1100/10 ml-auto flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 p-0 transition-none lg:ml-2 lg:size-10"
          iconClassName="lg:size-6"
          contentClassName="bg-t-1100/10 z-110 backdrop-blur-xl [&_[data-slot=select-item]]:hover:bg-t-1100/10 [&_[data-slot=select-item]]:focus:bg-t-1100/10 [&_[data-slot=select-item][data-state=checked]]:bg-t-1100/10"
        />
      </div>
    </header>
  );
};

export default Header;
