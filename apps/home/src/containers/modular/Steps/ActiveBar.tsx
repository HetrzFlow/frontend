import { useEffect, useRef } from 'react';
import { cn } from '@repo/ui';

const ActiveBar = ({
  className,
  observerEle,
  activeTabEle,
  style,
  widthCompensation = 0,
  xOffset = 0,
  yOffset = 0,
  duration = 300,
}: {
  observerEle?: HTMLDivElement | null;
  activeTabEle?: HTMLDivElement | null;
  className?: string;
  style?: React.CSSProperties;
  widthCompensation?: number;
  xOffset?: number;
  yOffset?: number;
  duration?: number;
}) => {
  const mountedRef = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const barEle = barRef.current;

    if (barEle && activeTabEle) {
      const updateBarEleStyle = () => {
        const { offsetTop } = activeTabEle;

        barEle.style.transform = `translate(0, ${offsetTop + yOffset}px)`;
        // barEle.style.height = `${offsetHeight + widthCompensation}px`;
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
  ]);

  return (
    <div
      style={style}
      className={cn(
        'bg-foreground absolute top-0 left-0 transition-[width,transform] duration-0 ease-out',
        activeTabEle ? 'visible' : 'invisible',
        className,
      )}
      ref={barRef}
    />
  );
};

export default ActiveBar;
