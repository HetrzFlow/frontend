import { DependencyList, useEffect, useRef } from 'react';

// when deps updates, exec
export const useUpdateEffect = (effect: () => void, deps: DependencyList) => {
  const isMounted = useRef(false);
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const timer = setTimeout(() => {
      isMounted.current = true;
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    return effectRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
