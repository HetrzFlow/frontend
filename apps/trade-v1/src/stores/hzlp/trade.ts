import { UseFormReturn } from 'react-hook-form';
import { create } from 'zustand';

import { persist } from 'zustand/middleware';
import { HzlpTraderType } from '@/constants/hzlp/enum';

export type FormDataType = {
  paySz: {
    value?: string;
    coin?: string;
  };
  receiveSz: {
    value?: string;
    coin?: string;
  };
};

type FormType = {
  [HzlpTraderType.Buy]: FormDataType;
  [HzlpTraderType.Sell]: FormDataType;
};

interface TradeStore {
  tradeType: HzlpTraderType;
  formRefs: {
    [HzlpTraderType.Buy]?: UseFormReturn<FormDataType> | null;
    [HzlpTraderType.Sell]?: UseFormReturn<FormDataType> | null;
  };
  formData: {
    [HzlpTraderType.Buy]: FormDataType;
    [HzlpTraderType.Sell]: FormDataType;
  };
  setTradeType: (type: HzlpTraderType) => void;
  setFormRef: (refs: {
    [HzlpTraderType.Buy]?: UseFormReturn<FormDataType> | null;
    [HzlpTraderType.Sell]?: UseFormReturn<FormDataType> | null;
  }) => void;
  updateFormData: <G extends HzlpTraderType.Buy | HzlpTraderType.Sell>(
    tradeType: G,
    values: Partial<FormType[G]>,
  ) => void;
}

type PersistedStateType = {
  tradeType: 'buy' | 'sell';
  formData: {
    [HzlpTraderType.Buy]: {
      payCoin?: string;
    };
    [HzlpTraderType.Sell]: {
      receiveCoin?: string;
    };
  };
};

export const useTradeStore = create<
  TradeStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      tradeType: HzlpTraderType.Buy,

      formRefs: {},
      formData: {
        [HzlpTraderType.Buy]: {
          paySz: {
            value: '',
            coin: 'SUI',
          },
          receiveSz: {
            value: '',
            coin: 'HzLP',
          },
        },
        [HzlpTraderType.Sell]: {
          paySz: {
            value: '',
            coin: 'HzLP',
          },
          receiveSz: {
            value: '',
            coin: 'SUI',
          },
        },
      },
      setTradeType: (tradeType) => {
        window.location.hash = '';
        set({ tradeType });
      },
      setFormRef: (refs) => {
        Object.assign(get().formRefs, refs);
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
      name: 'v1-hzlp.commonTradeStore',
      partialize: ({ tradeType, formData }) => ({
        tradeType: tradeType === HzlpTraderType.Sell ? 'sell' : 'buy',
        formData: {
          [HzlpTraderType.Buy]: {
            payCoin: formData[HzlpTraderType.Buy].paySz.coin,
          },
          [HzlpTraderType.Sell]: {
            receiveCoin: formData[HzlpTraderType.Sell].receiveSz.coin,
          },
        },
      }),
      merge: (persistedState, currentState) => {
        const _persistedState = persistedState as PersistedStateType;
        const hashParams: Record<string, string> = Object.fromEntries(
          window.location.hash
            .slice(1)
            .split('&')
            .map((v) => v.split('=')),
        );
        const side = hashParams['side'];

        const payCoin =
          hashParams['payCoin'] ||
          _persistedState.formData[HzlpTraderType.Buy].payCoin ||
          currentState.formData[HzlpTraderType.Buy].paySz.coin;

        return {
          ...currentState,
          tradeType: side === 'sell' ? HzlpTraderType.Sell : HzlpTraderType.Buy,

          formData: {
            ...currentState.formData,
            [HzlpTraderType.Buy]: {
              ...currentState.formData[HzlpTraderType.Buy],
              paySz: {
                coin: payCoin,
              },
            },
            [HzlpTraderType.Sell]: {
              ...currentState.formData[HzlpTraderType.Sell],
              receiveSz: {
                coin:
                  _persistedState.formData[HzlpTraderType.Sell].receiveCoin ||
                  currentState.formData[HzlpTraderType.Sell].receiveSz.coin,
              },
            },
          },
        };
      },
    },
  ),
);
