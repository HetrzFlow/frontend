'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

import { create, useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Inst } from '@/common';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';

interface TradeGlobalState {
  instId: string;
  routeInstId: string;
  maxPositionSize: number; // max position size
}

interface TradeGlobalAction {
  setInst: (inst: Inst) => void;
}

interface PersistedStateType {
  instId: string;
  routeInstId: string;
}

export const createTradeGlobalStore = (
  initialData: Partial<TradeGlobalState>,
) => {
  return create<
    TradeGlobalState & TradeGlobalAction,
    [['zustand/persist', PersistedStateType]]
  >(
    persist(
      (set) => ({
        instId: '',
        routeInstId: '',
        maxPositionSize: 10000,
        ...initialData,
        setInst: (inst: Inst) => {
          const routeInstId = buildTradeRouteInstIdByCategory(
            inst.name,
            inst.category,
          );
          document.cookie = `INST_ID=${routeInstId};path=/`;
          set({
            instId: inst.id,
            routeInstId,
          });
        },
      }),
      {
        name: 'v2-trade.tradeGlobalStore',
        version: 2,
        partialize: ({ instId, routeInstId }) => ({
          instId,
          routeInstId,
        }),
        merge: (persistedState, currentState) => {
          const _persistedState = persistedState as Partial<PersistedStateType>;
          return {
            ...currentState,
            ..._persistedState,
            routeInstId:
              _persistedState.routeInstId ?? currentState.routeInstId,
          };
        },
      },
    ),
  );
};

const defaultTradeGlobalStore = createTradeGlobalStore({});
const TradeGlobalContext = createContext(defaultTradeGlobalStore);

export const TradeGlobalStoreProvider = ({
  value,
  children,
}: {
  value?: Partial<TradeGlobalState>;
  children: ReactNode;
}) => {
  const [tradeGlobalStore] = useState(() =>
    createTradeGlobalStore(value || {}),
  );

  return (
    <TradeGlobalContext.Provider value={tradeGlobalStore}>
      {children}
    </TradeGlobalContext.Provider>
  );
};

export function useTradeGlobalStore<T>(
  selector: (state: TradeGlobalState & TradeGlobalAction) => T,
) {
  const tradeGlobalStore = useContext(TradeGlobalContext);

  return useStore(tradeGlobalStore, selector);
}

// Keep old exports for backward compatibility
export const GlobalStoreProvider = TradeGlobalStoreProvider;
