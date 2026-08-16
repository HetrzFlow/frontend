'use client';

import {
  ReactNode,
  UIEventHandler,
  useCallback,
  useDeferredValue,
  useState,
} from 'react';
import { cn, useResizeObserver } from '@repo/ui';

interface HorizontalScrollBoxProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scrollWidth?: string;
  shadowOpacity?: number;
  sideContent?: ReactNode;
}

export default function HorizontalScrollBox({
  children,
  className,
  contentClassName,
  scrollWidth,
  shadowOpacity = 1,
  sideContent,
}: HorizontalScrollBoxProps) {
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const deferredShowLeftShadow = useDeferredValue(showLeftShadow);
  const deferredShowRightShadow = useDeferredValue(showRightShadow);

  const scrollDivRef = useResizeObserver<HTMLDivElement>((entry) => {
    const { scrollLeft, scrollWidth, clientWidth } = entry.target;
    setShowLeftShadow(scrollLeft > 1);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  });

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(() => {
    if (!scrollDivRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollDivRef.current;
    setShowLeftShadow(scrollLeft > 1);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  }, [scrollDivRef]);

  return (
    <div
      className={cn(
        'z-1 relative min-w-0 overflow-hidden',
        "before:pointer-events-none before:absolute before:top-0 before:left-0 before:h-full before:w-[50px] before:opacity-[var(--shadow-opacity)] before:content-['']",
        "after:pointer-events-none after:absolute after:top-0 after:right-0 after:h-full after:w-[50px] after:opacity-[var(--shadow-opacity)] after:content-['']",
        deferredShowLeftShadow
          ? 'before:block before:bg-[linear-gradient(to_right,var(--bg-card-mix),transparent)]'
          : 'before:hidden before:bg-transparent',
        deferredShowRightShadow
          ? 'after:block after:bg-[linear-gradient(to_right,transparent,var(--bg-card-mix))]'
          : 'after:hidden after:bg-transparent',
        className,
      )}
      style={
        {
          '--shadow-opacity': shadowOpacity,
        } as React.CSSProperties
      }
    >
      <div
        ref={scrollDivRef}
        onScroll={handleScroll}
        className="scrollbar-none overflow-x-auto"
      >
        <div
          className={contentClassName}
          style={scrollWidth ? { minWidth: scrollWidth } : undefined}
        >
          {children}
          {sideContent}
        </div>
      </div>
    </div>
  );
}
