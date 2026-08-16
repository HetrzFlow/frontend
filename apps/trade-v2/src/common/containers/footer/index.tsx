'use client';

import { FC, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@repo/i18n/const';
import { cn } from '@repo/ui';
// import Tools from '../tools';
// import Logo from './Logo';
import SocialLinks from './SocialLinks';

interface FooterProps {
  className?: string;
}

const Footer: FC<FooterProps> = ({ className }) => {
  const pathname = usePathname();
  const activeItem = useMemo(() => {
    const pathParams = pathname.split('/');
    return (
      (SUPPORTED_LOCALES.includes(pathParams[1]!)
        ? pathParams[2]
        : pathParams[1]) || ''
    );
  }, [pathname]);

  return (
    <footer
      className={cn(
        'text-t-430 bg-bg-1/60 fixed bottom-0 z-40 flex h-8 w-full items-center justify-between px-2 pb-2 text-xs backdrop-blur-[20px] max-md:hidden',
        activeItem === 'leaderboard' && 'bg-black backdrop-blur-none',
        className,
      )}
    >
      {/* <Tools /> */}
      {/* <Logo /> */}
      <SocialLinks />
    </footer>
  );
};

export default Footer;
