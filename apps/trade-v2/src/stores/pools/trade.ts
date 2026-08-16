import { UseFormReturn } from 'react-hook-form';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const USDT_NAME = 'USDT' as const;
export const HZLP_NAME = 'HzLP' as const;
export const HZV_NAME = 'HzV' as const;
export enum LiqTradeType {
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
}

export type TradeVenue = 'pool' | 'vault';

export const getTradeKey = (marketAddress: string, venue: TradeVenue) => {
  return `${venue}:${marketAddress.toLowerCase()}`;
};
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

type PoolSTradeFormType = {
  [LiqTradeType.Deposit]: FormDataType;
  [LiqTradeType.Withdraw]: FormDataType;
};

interface PoolsTradeStore {
  tradeType: LiqTradeType;
  isTransactingByKey: Record<string, boolean>;
  submitPendingByKey: Record<string, boolean>;
  formRefs: {
    [LiqTradeType.Deposit]?: UseFormReturn<FormDataType> | null;
    [LiqTradeType.Withdraw]?: UseFormReturn<FormDataType> | null;
  };
  formData: {
    [LiqTradeType.Deposit]: FormDataType;
    [LiqTradeType.Withdraw]: FormDataType;
  };
  setTradeType: (type: LiqTradeType, tradeKey?: string) => void;
  setIsTransacting: (tradeKey: string, isTransacting: boolean) => void;
  setSubmitPending: (tradeKey: string, isPending: boolean) => void;
  setFormRef: (refs: {
    [LiqTradeType.Deposit]?: UseFormReturn<FormDataType> | null;
    [LiqTradeType.Withdraw]?: UseFormReturn<FormDataType> | null;
  }) => void;
  updateFormData: <G extends LiqTradeType.Deposit | LiqTradeType.Withdraw>(
    tradeType: G,
    values: Partial<PoolSTradeFormType[G]>,
  ) => void;
}

type PersistedStateType = {
  formData: {
    [LiqTradeType.Deposit]: {
      payCoin?: string;
    };
    [LiqTradeType.Withdraw]: {
      receiveCoin?: string;
    };
  };
};

export const usePoolsTradeStore = create<
  PoolsTradeStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set, get) => ({
      tradeType: LiqTradeType.Deposit,
      isTransactingByKey: {},
      submitPendingByKey: {},
      formRefs: {},
      formData: {
        [LiqTradeType.Deposit]: {
          paySz: {
            value: '',
            coin: USDT_NAME,
          },
          receiveSz: {
            value: '',
            coin: HZLP_NAME,
          },
        },
        [LiqTradeType.Withdraw]: {
          paySz: {
            value: '',
            coin: HZLP_NAME,
          },
          receiveSz: {
            value: '',
            coin: USDT_NAME,
          },
        },
      },
      setTradeType: (tradeType, tradeKey) => {
        const { isTransactingByKey } = get();
        if (tradeKey) {
          if (isTransactingByKey[tradeKey]) return;
        } else if (Object.values(isTransactingByKey).some(Boolean)) {
          return;
        }
        window.location.hash = '';
        // decision: reset values on tab switch
        const refs = get().formRefs;
        const curr = get().formData[tradeType];
        const nextVals = {
          paySz: { ...curr.paySz, value: '' },
          receiveSz: { ...curr.receiveSz, value: '' },
        } as const;
        // reset form instance if present
        refs[tradeType]?.reset(nextVals as FormDataType);
        // sync store state
        set((state) => ({
          tradeType,
          formData: {
            ...state.formData,
            [tradeType]: nextVals,
          },
        }));
      },
      setIsTransacting: (tradeKey, isTransacting) => {
        set((state) => {
          const next = { ...state.isTransactingByKey };
          if (isTransacting) {
            next[tradeKey] = true;
          } else {
            delete next[tradeKey];
          }
          return { isTransactingByKey: next };
        });
      },
      setSubmitPending: (tradeKey, isPending) => {
        set((state) => {
          const next = { ...state.submitPendingByKey };
          if (isPending) {
            next[tradeKey] = true;
          } else {
            delete next[tradeKey];
          }
          return { submitPendingByKey: next };
        });
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
      name: 'v2-pools.commonTradeStore',
      partialize: ({ formData }) => ({
        formData: {
          [LiqTradeType.Deposit]: {
            payCoin: formData[LiqTradeType.Deposit].paySz.coin,
          },
          [LiqTradeType.Withdraw]: {
            receiveCoin: formData[LiqTradeType.Withdraw].receiveSz.coin,
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
        const payCoin =
          hashParams['payCoin'] ||
          _persistedState.formData[LiqTradeType.Deposit].payCoin ||
          currentState.formData[LiqTradeType.Deposit].paySz.coin;

        return {
          ...currentState,
          formData: {
            ...currentState.formData,
            [LiqTradeType.Deposit]: {
              ...currentState.formData[LiqTradeType.Deposit],
              paySz: {
                coin: payCoin,
              },
            },
            [LiqTradeType.Withdraw]: {
              ...currentState.formData[LiqTradeType.Withdraw],
              receiveSz: {
                coin:
                  _persistedState.formData[LiqTradeType.Withdraw].receiveCoin ||
                  currentState.formData[LiqTradeType.Withdraw].receiveSz.coin,
              },
            },
          },
        };
      },
    },
  ),
);
