import React, { FC, forwardRef, ReactNode, useState } from 'react';
import Link from 'next/link';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { cn } from '@repo/ui';

interface NavProps {
  link: string;
  title: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  target?: string;
  disabled?: boolean;
  isInternalLink?: boolean;
  className?: string;
  hideActiveBg?: boolean;
  onClick?: () => void;
}

const NavItem = forwardRef<HTMLAnchorElement & HTMLDivElement, NavProps>(
  (
    {
      link,
      icon,
      title,
      active,
      target,
      disabled,
      isInternalLink,
      className,
      hideActiveBg,
      onClick,
    },
    ref,
  ) => {
    const [hover, setHover] = useState(false);
    const A = disabled || !link ? 'div' : isInternalLink ? Link : 'a';

    return (
      <>
        <A
          ref={ref}
          href={link}
          target={target}
          className={cn(
            'hover:text-foreground relative flex items-center justify-center rounded-full',
            active ? 'max-md:text-accent text-foreground' : '',
            disabled ? 'cursor-not-allowed hover:text-inherit' : '',
            className,
          )}
          prefetch={A !== 'a' && A !== 'div' ? true : undefined}
          rel="noopener noreferrer"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={onClick}
        >
          <div
            className={cn(
              'absolute -left-4 -z-1 h-8 w-[calc(100%+32px)] rounded-full max-md:-left-[24px] max-md:h-[48px] max-md:w-[calc(100%+48px)]',
              active ? 'bg-bg-5 max-md:bg-bg-3-h5' : '',
              hideActiveBg ? 'hidden' : 'block',
            )}
          />
          <div className="flex items-center gap-1 max-md:flex-col">
            {icon}
            {title}
          </div>
          {hover && disabled && (
            <div className="bg-bg-4 text-t-1100 absolute -bottom-6.5 left-1/2 -translate-x-1/2 rounded-sm px-2 py-1 text-xs whitespace-nowrap">
              {i18n._(msg`Coming Soon`)}
            </div>
          )}
        </A>

        {A === 'a' && !disabled && (
          <link rel="prefetch" href={link} as="document" />
        )}
      </>
    );
  },
);

NavItem.displayName = 'NavItem';

export default NavItem;
