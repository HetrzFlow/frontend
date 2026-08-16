'use client';

import { useEffect, useRef, useState } from 'react';
import { useMediaQuery as useMediaQueryBase } from 'react-responsive';

// listen dom
export const useResizeObserver = <T extends HTMLElement>(
  callback: (entry: ResizeObserverEntry) => void,
  ele?: T | null,
) => {
  const ref = useRef<T>(ele ?? null);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  if (ele) {
    ref.current = ele;
  }

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        cbRef.current(entry);
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ele]);

  return ref;
};

export enum MEDIA_SIZES {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
  '2XL' = '2xl',
  '3XL' = '3xl',
}

// Get current media size synchronously (can be used in functions, not just components)
export const getMediaSize = (): MEDIA_SIZES => {
  if (typeof window === 'undefined') return MEDIA_SIZES.MD;

  const width = window.innerWidth;

  if (width >= 1920) return MEDIA_SIZES['3XL'];
  if (width >= 1440) return MEDIA_SIZES['2XL'];
  if (width >= 1280) return MEDIA_SIZES.XL;
  if (width >= 1120) return MEDIA_SIZES.LG;
  if (width >= 768) return MEDIA_SIZES.MD;
  return MEDIA_SIZES.SM;
};

// media query
export const useMediaQuery = () => {
  const isSm = useMediaQueryBase({ maxWidth: 768 });
  const isMd = useMediaQueryBase({ minWidth: 768, maxWidth: 1120 });
  const isLg = useMediaQueryBase({ minWidth: 1120, maxWidth: 1280 });
  const isXl = useMediaQueryBase({ minWidth: 1280, maxWidth: 1440 });
  const is2Xl = useMediaQueryBase({ minWidth: 1440, maxWidth: 1920 });
  const is3Xl = useMediaQueryBase({ minWidth: 1920 });

  if (is3Xl) {
    return MEDIA_SIZES['3XL'];
  }

  if (is2Xl) {
    return MEDIA_SIZES['2XL'];
  }

  if (isXl) {
    return MEDIA_SIZES.XL;
  }

  if (isLg) {
    return MEDIA_SIZES.LG;
  }

  if (isMd) {
    return MEDIA_SIZES.MD;
  }

  if (isSm) {
    return MEDIA_SIZES.SM;
  }

  return MEDIA_SIZES.MD;
};

// touch/hover query
export function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)');
    setIsTouch(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isTouch;
}
