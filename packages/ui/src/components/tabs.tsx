import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { useResizeObserver } from '../lib/hooks';
import { cn } from '../lib/utils';

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function TabsList({
  wrapClassName,
  className,
  onScroll,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  wrapClassName?: string;
}) {
  const [frontScroll, setFrontScroll] = React.useState(false);
  const [backScroll, setBackScroll] = React.useState(false);
  const deferredFrontScroll = React.useDeferredValue(frontScroll);
  const deferredBackScroll = React.useDeferredValue(backScroll);

  const scrollDivRef = useResizeObserver<HTMLDivElement>((entry) => {
    const { scrollLeft, scrollWidth, clientWidth } = entry.target;
    setFrontScroll(scrollLeft > 1);
    setBackScroll(scrollLeft < scrollWidth - clientWidth - 1);
  });

  const handleScroll: React.UIEventHandler<HTMLDivElement> = React.useCallback(
    (e) => {
      if (onScroll) {
        onScroll(e);
      }
      if (!scrollDivRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollDivRef.current;
      setFrontScroll(scrollLeft > 1);
      setBackScroll(scrollLeft < scrollWidth - clientWidth - 1);
    },
    [scrollDivRef, onScroll],
  );

  return (
    <div
      className={cn(
        'relative',
        "before:pointer-events-none before:absolute before:top-0 before:left-0 before:z-10 before:h-full before:w-20 before:content-['']",
        "after:pointer-events-none after:absolute after:top-0 after:right-0 after:z-10 after:h-full after:w-20 after:content-['']",
        deferredFrontScroll
          ? 'before:block before:bg-[linear-gradient(to_right,var(--bg-tab-list-overflow-shadow,var(--bg-card-mix)),transparent)]'
          : 'before:hidden before:bg-transparent',
        deferredBackScroll
          ? 'after:block after:bg-[linear-gradient(to_right,transparent,var(--bg-tab-list-overflow-shadow,var(--bg-card-mix)))]'
          : 'after:hidden after:bg-transparent',
        wrapClassName,
      )}
    >
      <TabsPrimitive.List
        data-slot="tabs-list"
        ref={scrollDivRef}
        onScroll={handleScroll}
        className={cn(
          'text-muted-foreground scrollbar-none relative inline-flex w-fit items-center justify-center overflow-x-auto rounded-lg bg-transparent',
          className,
        )}
        {...props}
      />
    </div>
  );
}

const TabsTrigger = React.forwardRef(
  (
    { className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>,
    ref: React.ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <TabsPrimitive.Trigger
        data-slot="tabs-trigger"
        ref={ref}
        className={cn(
          'data-[state=active]:bg-primary data-[state=active]:text-foreground hover:text-foreground focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap hover:transition-[color,box-shadow] focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
          className,
        )}
        {...props}
      />
    );
  },
);

TabsTrigger.displayName = 'TabsTrigger';

function TabsActiveBar({
  className,
  observerEle,
  activeTabEle,
  style,
  widthCompensation = 0,
  xOffset = 0,
  yOffset = 0,
  duration = 300,
  orientation = 'horizontal',
}: {
  observerEle?: HTMLDivElement | null;
  activeTabEle?: HTMLButtonElement | null;
  className?: string;
  style?: React.CSSProperties;
  widthCompensation?: number;
  xOffset?: number;
  yOffset?: number;
  duration?: number;
  orientation?: 'horizontal' | 'vertical';
}) {
  const mountedRef = React.useRef(false);
  const barRef = React.useRef<HTMLDivElement>(null);
  const isHorizontal = orientation === 'horizontal';
  React.useEffect(() => {
    const barEle = barRef.current;

    if (barEle && activeTabEle) {
      const updateBarEleStyle = () => {
        const { offsetLeft, offsetWidth, offsetTop } = activeTabEle;
        const xDis = isHorizontal ? offsetLeft + xOffset : 0;
        const yDis = !isHorizontal ? offsetTop + yOffset : 0;

        barEle.style.transform = `translate(${xDis}px, ${yDis}px)`;
        barEle.style.width = `${offsetWidth + widthCompensation}px`;
        if (!mountedRef.current) {
          mountedRef.current = true;
          // next frame
          requestAnimationFrame(() => {
            barEle.style.transitionDuration = `${duration}ms`;
            barEle.style.animationDuration = `${duration}ms`;
          });
        }
      };

      const observer = new ResizeObserver(() => {
        updateBarEleStyle();
      });

      observer.observe(observerEle || activeTabEle);

      return () => observer.disconnect();
    }
  }, [
    activeTabEle,
    observerEle,
    widthCompensation,
    xOffset,
    yOffset,
    duration,
    isHorizontal,
  ]);

  return (
    <div
      style={style}
      className={cn(
        'bg-foreground absolute left-0 h-[2px] transition-[width,transform] duration-0 ease-out',
        isHorizontal ? 'bottom-0' : 'top-0',
        activeTabEle ? 'visible' : 'invisible',
        className,
      )}
      ref={barRef}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsActiveBar, TabsContent };
