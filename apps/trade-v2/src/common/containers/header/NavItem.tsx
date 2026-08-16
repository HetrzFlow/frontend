import React, {
  MouseEvent,
  CSSProperties,
  forwardRef,
  ReactNode,
  useState,
} from 'react';
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
  prefetchStrategy?: 'auto' | 'intent';
  className?: string;
  activeStyle?: CSSProperties;
  activeBgClassName?: string;
  hideActiveBg?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement & HTMLDivElement>) => void;
  onIntent?: () => void;
  variant?: 'tab' | 'menu';
}

const isModifiedClick = (
  event: MouseEvent<HTMLAnchorElement & HTMLDivElement>,
) =>
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey;

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
      prefetchStrategy = 'intent',
      className,
      activeStyle,
      activeBgClassName,
      hideActiveBg,
      onClick,
      onIntent,
      variant = 'tab',
    },
    ref,
  ) => {
    const [hover, setHover] = useState(false);
    // Use Link for internal navigation, 'a' for external links, 'div' for disabled items
    const A = disabled || !link ? 'div' : isInternalLink ? Link : 'a';

    const handleIntent = () => {
      if (isInternalLink && !active) {
        onIntent?.();
      }
    };

    const handleMouseEnter = () => {
      setHover(true);
      handleIntent();
    };

    const handleMouseLeave = () => setHover(false);

    const handleFocus = () => {
      handleIntent();
    };

    const handleClick = (
      event: MouseEvent<HTMLAnchorElement & HTMLDivElement>,
    ) => {
      if (isModifiedClick(event)) return;

      if (active && isInternalLink) {
        event.preventDefault();
        if (variant === 'tab') return;
      }
      onClick?.(event);
    };

    return (
      <A
        ref={ref}
        href={link}
        target={target}
        className={cn(
          variant === 'tab'
            ? 'max-mad:py-[4px] text-t-270 hover:text-t-1100 relative flex items-center justify-center rounded-xl px-3 py-2 duration-300 hover:transition-[color] max-md:flex-1 max-md:rounded-full max-md:px-0'
            : 'text-t-1100 relative flex w-full items-center justify-start rounded-[8px] px-2 py-2 text-xs tracking-[-0.48px] transition-colors focus-visible:bg-white/8 focus-visible:outline-none max-md:px-4 [@media(any-hover:hover)]:hover:bg-white/8',
          active ? (variant === 'tab' ? 'text-t-1100' : 'bg-bg-5') : '',
          disabled ? 'cursor-not-allowed opacity-50 hover:text-inherit' : '',
          className,
        )}
        style={active ? activeStyle : undefined}
        prefetch={isInternalLink ? prefetchStrategy === 'auto' : undefined}
        rel={!isInternalLink ? 'noopener noreferrer' : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onClick={handleClick}
      >
        {variant === 'tab' && (
          <div
            className={cn(
              'absolute -z-1 h-8 w-full rounded-xl max-md:h-[48px] max-md:rounded-full',
              active
                ? cn(activeBgClassName ?? 'bg-bg-2', 'max-md:bg-transparent')
                : '',
              hideActiveBg ? 'hidden' : 'block',
            )}
          />
        )}
        <div
          className={cn(
            'flex items-center gap-1 md:whitespace-nowrap',
            variant === 'tab'
              ? 'max-md:h-[40px] max-md:flex-col max-md:justify-center'
              : 'gap-2',
          )}
        >
          {icon}
          {title}
        </div>
        {hover && disabled && (
          <div className="bg-bg-4 text-t-1100 absolute -bottom-6.5 left-1/2 -translate-x-1/2 rounded-sm px-2 py-1 text-xs whitespace-nowrap">
            {i18n._(msg`Coming Soon`)}
          </div>
        )}
      </A>
    );
  },
);

NavItem.displayName = 'NavItem';

export default NavItem;
