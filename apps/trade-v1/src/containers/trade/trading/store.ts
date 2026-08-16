import { RefObject } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MARKET_PX } from '@/constants/common';
import { ORDER_TYPE, TRADE_TYPE } from '@/constants/enum';

// open position form
export type PositionForm = {
  px: string;
  paySz: {
    value?: string;
    coin?: string;
  };
  lever: string;
};

// persisted state
type PersistedStateType = {
  tradeType: TRADE_TYPE;
  orderType: ORDER_TYPE;
};

type FormType = {
  [TRADE_TYPE.long]: PositionForm;
  [TRADE_TYPE.short]: PositionForm;
};

type FormRefs = {
  [TRADE_TYPE.long]?: RefObject<UseFormReturn<PositionForm> | null> | null;
  [TRADE_TYPE.short]?: RefObject<UseFormReturn<PositionForm> | null> | null;
};

type FormEleRefs = {
  priceInput?: RefObject<HTMLInputElement | null> | null;
};

interface TradeStore {
  smDialogOpen: boolean;
  tradeType: TRADE_TYPE;
  orderType: ORDER_TYPE;
  lever: string;
  formRefs: FormRefs;
  formEleRefs: FormEleRefs;
  formData: {
    [TRADE_TYPE.long]: PositionForm;
    [TRADE_TYPE.short]: PositionForm;
  };
  setStore: (obj: Partial<TradeStore>) => void;
  setTradeType: (type: TRADE_TYPE) => void;
  setOrderType: (type: ORDER_TYPE) => void;
  setLever: (lever: string) => void;
  setFormRef: (refs: FormRefs) => void;
  setFormEleRefs: (refs: FormEleRefs) => void;
  updateFormData: <G extends TRADE_TYPE.long | TRADE_TYPE.short>(
    tradeType: G,
    values: Partial<FormType[G]>,
  ) => void;
}

export const useTradeStore = create<
  TradeStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      smDialogOpen: false,
      tradeType: TRADE_TYPE.long, // default long
      orderType: ORDER_TYPE.market, // default market
      // form ref
      formRefs: {},
      formEleRefs: {},
      formData: {
        [TRADE_TYPE.long]: {
          px: MARKET_PX,
          paySz: {
            value: '',
            coin: '',
          },
          lever: '10',
        },
        [TRADE_TYPE.short]: {
          px: MARKET_PX,
          paySz: {
            value: '',
            coin: '',
          },
          lever: '10',
        },
      },
      lever: '10',
      setStore: (obj) => set(obj),
      setTradeType: (tradeType) => {
        const { formRefs, tradeType: prevTradeType, updateFormData } = get();
        const { paySz: prevPaySz } =
          formRefs[
            prevTradeType as TRADE_TYPE.long | TRADE_TYPE.short
          ]?.current?.getValues() || {};
        if (prevPaySz) {
          const newValues = { paySz: prevPaySz };
          updateFormData(
            tradeType as TRADE_TYPE.long | TRADE_TYPE.short,
            newValues,
          );
        }
        set({ tradeType });
      },
      setOrderType: (orderType) => {
        set({ orderType });
      },
      setLever: (lever) => set({ lever }),
      setFormRef: (refs) => {
        // not trigger update
        Object.assign(get().formRefs, refs);
      },
      setFormEleRefs: (refs) => {
        // not trigger update
        Object.assign(get().formEleRefs, refs);
      },
      updateFormData: (tradeType, values) => {
        set((state) => {
          state.formData[tradeType] = Object.assign(
            {},
            state.formData[tradeType],
            values,
          );
          return { formData: { ...state.formData } };
        });
      },
    }),
    {
      name: 'v1-trade.tradeStore', // localStorage key
      partialize: ({ tradeType, orderType, lever }) => ({
        tradeType,
        orderType,
        lever,
      }),
      merge: (persistedState, currentState) => {
        const _persistedState = persistedState as PersistedStateType;

        // if is not long or short, set to long
        if (
          _persistedState.tradeType &&
          ![TRADE_TYPE.long, TRADE_TYPE.short].includes(
            _persistedState.tradeType,
          )
        ) {
          _persistedState.tradeType = TRADE_TYPE.long;
        }
        return {
          ...currentState,
          ..._persistedState,
        };
      },
    },
  ),
);
