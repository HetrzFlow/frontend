'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

import { create, StoreApi, UseBoundStore, useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { InstStoreProvider } from './instStore';
const PRICE_MULTIPLIER_DECIMAL = 30;

interface FirstVisitState {
  hasAcceptedInviteCodeDialog: boolean;
  showOnboardingDialog: boolean;
  onOnboardingDialogClose: (accept: boolean) => void;
  onOnboardingDialogOpen: (accept: boolean) => void;
}
type GlobalState = FirstVisitState & {
  isGreenUp: boolean;
  usdAmountDecimal: number;
  usdAmountDisplayDecimal: number;
  leverDecimal: number;
  activeNavItem: string;
};

interface GlobalAction {
  setStoreState: (obj: Partial<GlobalState>) => void;
}

type PersistedStateType = {
  isGreenUp: boolean;
  hasAcceptedInviteCodeDialog?: boolean;
  showOnboardingDialog?: boolean;
};

const memoGlobalStoresMap = new Map();

export const createGlobalStore = (initialData: Partial<GlobalState>) => {
  if (memoGlobalStoresMap.get(initialData)) {
    return memoGlobalStoresMap.get(initialData);
  }
  const store = create<
    GlobalState & GlobalAction,
    [['zustand/persist', PersistedStateType]]
  >(
    persist(
      (set) => {
        return {
          isGreenUp: true,
          usdAmountDecimal: PRICE_MULTIPLIER_DECIMAL,
          usdAmountDisplayDecimal: 2,
          leverDecimal: 1,
          activeNavItem: '',
          hasAcceptedInviteCodeDialog: false,
          // true in client, false in server
          showOnboardingDialog: typeof window !== 'undefined',
          onOnboardingDialogClose: (accept) =>
            accept && set({ showOnboardingDialog: false }),
          onOnboardingDialogOpen: (accept) =>
            accept && set({ showOnboardingDialog: true }),
          ...initialData,
          setStoreState: (obj) => set(obj),
        };
      },
      {
        name: 'v2-common.globalStore',
        version: 1,
        partialize: ({
          isGreenUp,
          hasAcceptedInviteCodeDialog,
          showOnboardingDialog,
        }) => ({
          isGreenUp,
          hasAcceptedInviteCodeDialog,
          showOnboardingDialog,
        }),
      },
    ),
  );
  memoGlobalStoresMap.set(initialData, store);
  return store;
};

const Context = createContext(
  {} as UseBoundStore<StoreApi<GlobalState & GlobalAction>>,
);

export const GlobalStoreProvider = ({
  value,
  noInstStore,
  children,
}: {
  value?: Partial<GlobalState>;
  noInstStore?: boolean;
  children: ReactNode;
}) => {
  const [globalStore] = useState(() => {
    return createGlobalStore(value || {});
  });

  return (
    <Context.Provider value={globalStore}>
      {noInstStore ? (
        children
      ) : (
        <InstStoreProvider>{children}</InstStoreProvider>
      )}
    </Context.Provider>
  );
};

export function useGlobalStore<T>(
  selector: (state: GlobalState & GlobalAction) => T,
) {
  const globalStore = useContext(Context);

  return useStore(globalStore, selector);
}
