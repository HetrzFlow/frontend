'use client';
import { useEffect, useState } from 'react';

export const useIsShortViewport = (threshold = 700) => {
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsShort(window.innerHeight < threshold);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [threshold]);

  return isShort;
};
