'use client';

import { createContext, ReactElement, useContext, useState } from 'react';

import { PRICE_MULTIPLIER_DECIMAL } from '@hertzflow/sdk';
import { create, StoreApi, UseBoundStore, useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { InstStoreProvider } from './instStore';

interface FirstVisitState {
  showRiskNoticeDialog: boolean;
  onRiskNoticeDialogClose: (accept: boolean) => void;
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
  navInternalLinks: string[];
};

interface GlobalAction {
  setStoreState: (obj: Partial<GlobalState>) => void;
}

type PersistedStateType = {
  isGreenUp: boolean;
  showRiskNoticeDialog?: boolean;
  showOnboardingDialog?: boolean;
};

export const createGlobalStore = (initialData: Partial<GlobalState>) => {
  return create<
    GlobalState & GlobalAction,
    [['zustand/persist', PersistedStateType]]
  >(
    persist(
      (set, get) => {
        return {
          isGreenUp: true,
          usdAmountDecimal: PRICE_MULTIPLIER_DECIMAL,
          usdAmountDisplayDecimal: 2,
          leverDecimal: 1,
          activeNavItem: '',
          navInternalLinks: [],
          // true in client, false in server
          showRiskNoticeDialog: typeof window !== 'undefined',
          showOnboardingDialog: typeof window !== 'undefined',
          onRiskNoticeDialogClose: (accept) =>
            accept && set({ showRiskNoticeDialog: false }),
          onOnboardingDialogClose: (accept) =>
            accept && set({ showOnboardingDialog: false }),
          onOnboardingDialogOpen: (accept) =>
            accept && set({ showOnboardingDialog: true }),
          ...initialData,
          setStoreState: (obj) => set(obj),
        };
      },
      {
        name: 'v1-common.globalStore',
        partialize: ({
          isGreenUp,
          showRiskNoticeDialog,
          showOnboardingDialog,
        }) => ({
          isGreenUp,
          showRiskNoticeDialog,
          showOnboardingDialog,
        }),
      },
    ),
  );
};

const Context = createContext(
  {} as UseBoundStore<StoreApi<GlobalState & GlobalAction>>,
);

// add greenUp, redUp on html tag
function script(isGreenUp: boolean) {
  try {
    const storageData: Record<string, Record<string, string>> = JSON.parse(
      localStorage.getItem('v1-common.globalStore') || '{}',
    );
    const finalIsGreenUp = storageData.state?.isGreenUp ?? isGreenUp;
    const el = document.documentElement;
    el.classList.remove('greenUp', 'redUp');
    el.classList.add(finalIsGreenUp ? 'greenUp' : 'redUp');
  } catch (e) {
    //
  }
}

export const GlobalStoreProvider = ({
  value,
  noInstStore,
  children,
}: {
  value?: Partial<GlobalState>;
  noInstStore?: boolean;
  children: ReactElement | ReactElement[];
}) => {
  const [globalStore] = useState(() => createGlobalStore(value || {}));

  return (
    <Context.Provider value={globalStore}>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(${script.toString()})(${value?.isGreenUp || true})`,
        }}
      />
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
