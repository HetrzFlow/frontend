import { useEffect, useRef } from 'react';

export const useResizeObserver = <T extends HTMLElement>(
  callback: (entry: ResizeObserverEntry) => void,
) => {
  const ref = useRef<T>(null);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        cbRef.current(entry);
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return ref;
};
