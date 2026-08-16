import {
  FC,
  memo,
  UIEventHandler,
  useCallback,
  useDeferredValue,
  useState,
  WheelEvent,
} from 'react';

import { cn, Separator, useResizeObserver } from '@repo/ui';

import styles from '../index.module.css';
import InstSelector from '../InstSelector';
import Liq from '../Liq';
import Price from '../Price';
import Ticker from '../Ticker';

const Market: FC = () => {
  const [frontScroll, setFrontScroll] = useState(false);
  const [backScroll, setBackScroll] = useState(false);
  const deferredFrontScroll = useDeferredValue(frontScroll);
  const deferredBackScroll = useDeferredValue(backScroll);

  const scrollDivRef = useResizeObserver<HTMLDivElement>((entry) => {
    const { scrollLeft, scrollWidth, clientWidth } = entry.target;
    setFrontScroll(scrollLeft > 1);
    setBackScroll(scrollLeft < scrollWidth - clientWidth - 1);
  });

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(() => {
    if (!scrollDivRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollDivRef.current;
    setFrontScroll(scrollLeft > 1);
    setBackScroll(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      if (!scrollDivRef.current) return;
      if (e.deltaX) {
        scrollDivRef.current.style.scrollBehavior = 'none';
        return;
      }
      scrollDivRef.current.style.scrollBehavior = 'smooth';
      const modifier = e.deltaY > 0 ? 1 : -1;
      // limit 100 to smooth scroll
      scrollDivRef.current.scrollLeft +=
        modifier * Math.max(100, Math.abs(e.deltaY));
    },
    [scrollDivRef],
  );

  return (
    <div className="flex h-10 items-center gap-4 overflow-hidden">
      <InstSelector />
      <Separator orientation="vertical" />
      <Price />
      <div
        className={cn(
          'ml-4 h-full min-w-0 shrink',
          styles.scrollContainer,
          deferredFrontScroll ? styles.frontScroll : '',
          deferredBackScroll ? styles.backScroll : '',
        )}
      >
        <div
          ref={scrollDivRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          className={cn(
            'scrollbar-none flex h-full items-center gap-4 overflow-x-auto overflow-y-hidden overscroll-contain font-medium',
          )}
        >
          <Ticker />
          <Separator orientation="vertical" />
          <Liq />
        </div>
      </div>
    </div>
  );
};

export default memo(Market);
