import { DependencyList, useEffect, useRef } from 'react';

export const useUpdateEffect = (effect: () => void, deps: DependencyList) => {
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      return effect();
    }
  }, [effect]);
};
