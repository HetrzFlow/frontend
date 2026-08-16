'use client';

import { useRef, useSyncExternalStore } from 'react';

type RafReadyStore = {
  getSnapshot: () => boolean;
  getServerSnapshot: () => boolean;
  subscribe: (listener: () => void) => () => void;
};

function createRafReadyStore(): RafReadyStore {
  let ready = false;
  let frameId: number | null = null;
  const listeners = new Set<() => void>();

  const scheduleReady = () => {
    if (ready || frameId !== null || typeof window === 'undefined') return;
    frameId = window.requestAnimationFrame(() => {
      ready = true;
      frameId = null;
      listeners.forEach((listener) => listener());
    });
  };

  return {
    getSnapshot: () => ready,
    getServerSnapshot: () => false,
    subscribe: (listener) => {
      listeners.add(listener);
      scheduleReady();

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
      };
    },
  };
}

export function useRafReady() {
  const storeRef = useRef<RafReadyStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createRafReadyStore();
  }

  return useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    storeRef.current.getServerSnapshot,
  );
}
