import { useSyncExternalStore } from 'react';

type NowStore = {
  snapshot: number;
  subscribers: Set<() => void>;
  timer?: ReturnType<typeof setInterval>;
};

const nowStores = new Map<number, NowStore>();

function getNowStore(intervalMs: number) {
  const normalizedInterval = Math.max(1, intervalMs);
  const existingStore = nowStores.get(normalizedInterval);
  if (existingStore) return existingStore;

  const store: NowStore = {
    snapshot: Date.now(),
    subscribers: new Set(),
  };
  nowStores.set(normalizedInterval, store);

  return store;
}

function emitNowChange(store: NowStore) {
  store.snapshot = Date.now();
  store.subscribers.forEach((callback) => callback());
}

export function useNow(intervalMs: number) {
  const store = getNowStore(intervalMs);

  return useSyncExternalStore(
    (callback) => {
      store.subscribers.add(callback);

      if (!store.timer) {
        store.timer = setInterval(() => {
          emitNowChange(store);
        }, Math.max(1, intervalMs));
      }

      return () => {
        store.subscribers.delete(callback);
        if (!store.subscribers.size && store.timer) {
          clearInterval(store.timer);
          store.timer = undefined;
        }
      };
    },
    () => store.snapshot,
    () => store.snapshot,
  );
}
