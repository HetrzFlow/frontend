import { DependencyList, useEffect, useRef } from 'react';

// when deps updates, exec
export const useUpdateEffect = (effect: () => void, deps: DependencyList) => {
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      return effect();
    }
  }, deps);
};
