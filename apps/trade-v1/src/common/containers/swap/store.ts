import { RefObject } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ORDER_TYPE, TRADE_TYPE } from '../../services/enum';
import { resetCalcParams } from '../../services/rest/swap';
import { MARKET_PX } from './consts';

// swap form
export type SwapForm = {
  px: string;
  pxIsReversed: boolean; // recersed price
  paySz: {
    value?: string;
    coin?: string;
  };
  receiveSz: {
    value?: string;
    coin?: string;
  };
};

// persisted state
type PersistedStateType = {
  orderType: ORDER_TYPE;
  slippage: string;
  formData: {
    [TRADE_TYPE.swap]: {
      pxIsReversed: boolean;
    };
  };
};

interface TradeStore {
  orderType: ORDER_TYPE;
  slippage: string;
  formRefs: {
    [TRADE_TYPE.swap]?: RefObject<{
      form: UseFormReturn<SwapForm>;
      onPaySzChange: () => void;
      onReceiveSzChange: () => void;
    } | null> | null;
  };
  formData: {
    [TRADE_TYPE.swap]: SwapForm;
  };
  setOrderType: (type: ORDER_TYPE) => void;
  setSlippage: (slippage: string) => void;
  setFormRef: (refs: {
    [TRADE_TYPE.swap]?: RefObject<{
      form: UseFormReturn<SwapForm>;
      onPaySzChange: () => void;
      onReceiveSzChange: () => void;
    } | null> | null;
  }) => void;
  updateFormData: <G extends TRADE_TYPE>(
    tradeType: G,
    values: Partial<SwapForm>,
  ) => void;
  resetFormData: () => void;
}

export const useSwapStore = create<
  TradeStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      orderType: ORDER_TYPE.market, // default market
      slippage: '0.005',
      // form ref
      formRefs: {},
      formData: {
        [TRADE_TYPE.swap]: {
          px: MARKET_PX,
          pxIsReversed: false,
          paySz: {
            value: '',
            coin: '',
          },
          receiveSz: {
            value: '',
            coin: '',
          },
        },
      },
      setOrderType: (orderType) => {
        set({ orderType });
      },
      setSlippage: (slippage) => {
        set({ slippage });
      },
      setFormRef: (refs) => {
        // not trigger update
        Object.assign(get().formRefs, refs);
      },
      updateFormData: (tradeType, values) => {
        set((state) => {
          state.formData.swap = Object.assign({}, state.formData.swap, values);
          return { formData: { ...state.formData } };
        });
      },
      resetFormData: () => {
        const formData = get().formData[TRADE_TYPE.swap];
        resetCalcParams({
          payCoinType: formData.paySz.coin,
          receiveCoinType: formData.receiveSz.coin,
        });
        Object.assign(formData, {
          px: MARKET_PX,
          paySz: {
            value: '',
            coin: formData.paySz.coin,
          },
          receiveSz: {
            value: '',
            coin: formData.receiveSz.coin,
          },
        });
      },
    }),
    {
      name: 'v1-common.swapStore', // localStorage key
      version: 1,
      migrate: (persistedState) => {
        return {
          ...(persistedState as PersistedStateType),
          slippage: '0.005',
        };
      },
      partialize: ({ orderType, slippage, formData }) => ({
        orderType,
        slippage,
        formData: {
          [TRADE_TYPE.swap]: {
            pxIsReversed: formData[TRADE_TYPE.swap].pxIsReversed,
          },
        },
      }),
      merge: (persistedState, currentState) => {
        const _persistedState = persistedState as PersistedStateType;

        return {
          ...currentState,
          ..._persistedState,
          orderType: ORDER_TYPE.market,
          formData: {
            ...currentState.formData,
            [TRADE_TYPE.swap]: {
              ...currentState.formData[TRADE_TYPE.swap],
              pxIsReversed:
                _persistedState.formData[TRADE_TYPE.swap].pxIsReversed,
            },
          },
        };
      },
    },
  ),
);
