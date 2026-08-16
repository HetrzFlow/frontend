'use client';

import {
  forwardRef,
  ReactNode,
  UIEventHandler,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { useResizeObserver } from '../lib/hooks';
import { cn } from '../lib/utils';

interface ScrollBoxProps {
  children: ReactNode;
  shadowClassName?: string;
  scrollClassName?: string;
  className?: string;
}

const useShowBShadow = (ele?: HTMLDivElement) => {
  const [showBShadow, setShowBShadow] = useState(false);
  const deferredShowBShadow = useDeferredValue(showBShadow);

  const updateBShadow = useCallback(() => {
    if (!ele) return;
    const { scrollTop, scrollHeight, clientHeight } = ele;
    setShowBShadow(scrollTop < scrollHeight - clientHeight - 1);
  }, [ele]);

  const scrollDivRef = useResizeObserver<HTMLDivElement>((entry) => {
    const { scrollTop, scrollHeight, clientHeight } = entry.target;
    setShowBShadow(scrollTop < scrollHeight - clientHeight - 1);
  }, ele);

  useEffect(() => {
    updateBShadow();
  }, [ele, updateBShadow]);

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback((event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    setShowBShadow(scrollTop < scrollHeight - clientHeight - 1);
  }, []);

  return {
    showBShadow: deferredShowBShadow,
    handleScroll,
    scrollDivRef,
    updateBShadow,
  };
};

const ScrollBox = forwardRef<HTMLDivElement, ScrollBoxProps>(
  ({ children, shadowClassName, scrollClassName, className }, ref) => {
    const { showBShadow, handleScroll, scrollDivRef } = useShowBShadow();

    useImperativeHandle(ref, () => scrollDivRef.current as HTMLDivElement);

    return (
      <div className={cn('relative h-full', className)}>
        <div
          ref={scrollDivRef}
          className={cn(
            'scrollbar-none h-full overflow-y-auto',
            scrollClassName,
          )}
          onScroll={handleScroll}
        >
          {children}
        </div>

        {showBShadow && (
          <div
            className={cn(
              'to-bg-card-mix pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent',
              shadowClassName,
            )}
          />
        )}
      </div>
    );
  },
);

ScrollBox.displayName = 'ScrollBox';

export { ScrollBox, useShowBShadow };
