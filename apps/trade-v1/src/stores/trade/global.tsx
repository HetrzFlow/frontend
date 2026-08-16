'use client';

import { createContext, ReactElement, useContext, useState } from 'react';

import { create, StoreApi, UseBoundStore, useStore } from 'zustand';

interface GlobalState {
  instId: string;
  maxPositionSize: number; // max position size
}

interface GlobalAction {
  setInstId: (instId: string) => void;
}

export const createGlobalStore = (initialData: Partial<GlobalState>) => {
  return create<GlobalState & GlobalAction>((set) => ({
    instId: 'SUI/USD',
    maxPositionSize: 10000,
    ...initialData,
    setInstId: (instId) => {
      document.cookie = `INST_ID=${instId.replace('/', '-')};path=/`;
      set({ instId });
    },
  }));
};

const Context = createContext(
  {} as UseBoundStore<StoreApi<GlobalState & GlobalAction>>,
);

export const GlobalStoreProvider = ({
  value,
  children,
}: {
  value?: Partial<GlobalState>;
  children: ReactElement | ReactElement[];
}) => {
  const [globalStore] = useState(() => createGlobalStore(value || {}));

  return <Context.Provider value={globalStore}>{children}</Context.Provider>;
};

export function useGlobalStore<T>(
  selector: (state: GlobalState & GlobalAction) => T,
) {
  const globalStore = useContext(Context);

  return useStore(globalStore, selector);
}
