import { RefObject } from 'react';

import { DeepPartial } from 'react-hook-form';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Coin, Position } from '@/common';
import { ORDER_TYPE, TRADE_TYPE } from '@/constants/enum';
import { MARKET_PX } from '@/constants/trade';

// open position form
export type PositionForm = {
  px: string;
  paySz: {
    value?: string;
    coin?: string;
    token?: PayToken;
  };
  lever: string;
  tpsl: {
    open: boolean;
    tpPx: string;
    slPx: string;
  };
};

export type PayToken = {
  name?: string;
  symbol: string;
  decimals: number;
  decimal?: number;
  logoURI?: string;
  price?: string;
  balance?: string;
};

export type PositionSizeAndFeesResultType = {
  openFee: string;
  feeDiscountUsd: string;
  priceImpact: string;
  deltaCollateralUsd: string;
  size: string;
  collateralAmount: string;
  isPending: boolean;
};

export type CalcPositionSizeParamsType = {
  payCoinType: string;
  payCoinAmount: string;
  payToken?: PayToken;
  payCoinPx?: string;
  quotedCollateralAmount?: string;
  collateralCoin?: Coin;
  targetCoinPx?: string;
  isLong: boolean;
  lever: string;
  borrowFee?: string;
  marketAddress: string;
  position?: Position;
  isZFP?: boolean;
};

export const DEFAULT_POSITION_SIZE_AND_FEES: PositionSizeAndFeesResultType = {
  openFee: '0',
  feeDiscountUsd: '0',
  priceImpact: '0',
  deltaCollateralUsd: '0',
  size: '',
  collateralAmount: '',
  isPending: false,
};

export const getPositionSizeAndFeesStoreKey = ({
  payCoinType,
  collateralCoinType,
  isZFP,
}: {
  payCoinType?: string;
  collateralCoinType?: string;
  isZFP?: boolean;
}) => `${payCoinType || ''}:${collateralCoinType || ''}:${isZFP ?? false}`;

// persisted state
type PersistedStateType = {
  orderType: ORDER_TYPE;
};

type FormType = {
  [TRADE_TYPE.long]: PositionForm;
  [TRADE_TYPE.short]: PositionForm;
};

type FormRefHandle = {
  getPaySz: () => PositionForm['paySz'];
  setPrice: (price: string) => void;
};

type FormRefs = {
  [TRADE_TYPE.long]?: RefObject<FormRefHandle | null> | null;
  [TRADE_TYPE.short]?: RefObject<FormRefHandle | null> | null;
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
  positionSizeAndFeesParams: CalcPositionSizeParamsType | null;
  positionSizeAndFeesResults: Record<
    string,
    PositionSizeAndFeesResultType | undefined
  >;
  isSubmitting: boolean;
  setStore: (obj: Partial<TradeStore>) => void;
  setTradeType: (type: TRADE_TYPE) => void;
  setOrderType: (type: ORDER_TYPE) => void;
  setLever: (lever: string) => void;
  setFormRef: (refs: FormRefs) => void;
  setFormEleRefs: (refs: FormEleRefs) => void;
  updateFormData: <G extends TRADE_TYPE.long | TRADE_TYPE.short>(
    tradeType: G,
    values: DeepPartial<FormType[G]>,
  ) => void;
  setPositionSizeAndFeesParams: (params: CalcPositionSizeParamsType) => void;
  setPositionSizeAndFeesResult: (
    key: string,
    result: PositionSizeAndFeesResultType | undefined,
  ) => void;
  setPositionSizeAndFeesPending: (key: string, isPending: boolean) => void;
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
          tpsl: {
            open: false,
            tpPx: '',
            slPx: '',
          },
        },
        [TRADE_TYPE.short]: {
          px: MARKET_PX,
          paySz: {
            value: '',
            coin: '',
          },
          lever: '10',
          tpsl: {
            open: false,
            tpPx: '',
            slPx: '',
          },
        },
      },
      lever: '10',
      positionSizeAndFeesParams: null,
      positionSizeAndFeesResults: {},
      isSubmitting: false,
      setStore: (obj) => set(obj),
      setTradeType: (tradeType) => {
        const { formRefs, tradeType: prevTradeType, updateFormData } = get();
        if (
          (prevTradeType === TRADE_TYPE.long ||
            prevTradeType === TRADE_TYPE.short) &&
          (tradeType === TRADE_TYPE.long || tradeType === TRADE_TYPE.short)
        ) {
          const prevPaySz = formRefs[prevTradeType]?.current?.getPaySz();
          if (!prevPaySz) {
            set({ tradeType });
            return;
          }
          const newValues = { paySz: prevPaySz };
          updateFormData(tradeType, newValues);
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
      setPositionSizeAndFeesParams: (positionSizeAndFeesParams) =>
        set({ positionSizeAndFeesParams }),
      setPositionSizeAndFeesResult: (key, result) =>
        set((state) => ({
          positionSizeAndFeesResults: {
            ...state.positionSizeAndFeesResults,
            [key]: result,
          },
        })),
      setPositionSizeAndFeesPending: (key, isPending) =>
        set((state) => ({
          positionSizeAndFeesResults: {
            ...state.positionSizeAndFeesResults,
            [key]: {
              ...(state.positionSizeAndFeesResults[key] ||
                DEFAULT_POSITION_SIZE_AND_FEES),
              isPending,
            },
          },
        })),
    }),
    {
      name: 'v2-trade.tradeStore', // localStorage key
      partialize: ({ tradeType, orderType, lever }) => ({
        tradeType: tradeType === TRADE_TYPE.swap ? TRADE_TYPE.long : tradeType,
        orderType,
        lever,
      }),
      merge: (persistedState, currentState) => {
        const _persistedState = persistedState as PersistedStateType;
        return {
          ...currentState,
          ..._persistedState,
        };
      },
    },
  ),
);

export const getCalcOpenPositionSizeParams = () =>
  useTradeStore.getState().positionSizeAndFeesParams;

export const getOpenPositionSizeAndFees = ({
  payCoinType,
  collateralCoinType,
  isZFP,
}: {
  payCoinType?: string;
  collateralCoinType?: string;
  isZFP?: boolean;
}) =>
  useTradeStore.getState().positionSizeAndFeesResults[
    getPositionSizeAndFeesStoreKey({
      payCoinType,
      collateralCoinType,
      isZFP,
    })
  ];
