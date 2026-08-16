import {
  FC,
  UIEventHandler,
  useCallback,
  useDeferredValue,
  useState,
  WheelEvent,
} from 'react';

import { cn, Separator, useResizeObserver } from '@repo/ui';

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
  }, [scrollDivRef]);

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
    <div className="marketContainer z-10 flex h-11 w-[calc(100vw-370px)] shrink-0 items-center gap-2 overflow-hidden max-md:w-full max-md:justify-between">
      <InstSelector />
      <Separator orientation="vertical" className="mx-2 !h-9 max-md:hidden" />
      <Price />
      <div
        className={cn(
          'relative h-full min-w-0 shrink max-md:hidden',
          "before:pointer-events-none before:absolute before:top-0 before:left-0 before:z-10 before:h-full before:w-20 before:content-['']",
          "after:pointer-events-none after:absolute after:top-0 after:right-0 after:z-10 after:h-full after:w-20 after:content-['']",
          deferredFrontScroll
            ? 'before:block before:bg-[linear-gradient(to_right,var(--bg-card-mix),transparent)]'
            : 'before:hidden before:bg-transparent',
          deferredBackScroll
            ? 'after:block after:bg-[linear-gradient(to_right,transparent,var(--bg-card-mix))]'
            : 'after:hidden after:bg-transparent',
        )}
      >
        <div
          ref={scrollDivRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          className={cn(
            'scrollbar-none flex h-full items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-contain font-medium',
          )}
        >
          <Ticker />
          <Separator orientation="vertical" className="!h-9" />
          <Liq />
        </div>
      </div>
    </div>
  );
};

export default Market;
