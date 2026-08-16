import { create } from 'zustand';

import type { Coin, Position } from '@/common';

export type ClosePosSizeAndFeesResultType = {
  closeFee: string | number;
  feeDiscountUsd: string | number;
  priceImpact: string | number;
  rawPriceImpact: string | number;
  proratedCollateralUsd: string;
  size: string;
  collateralAmount: string;
  fundingFee: string | number;
  finalDeltaCollateralAmount: string;
  receiveCoinAmount: string;
  closePx: string;
  collateralTokenPx: string;
  isPending: boolean;
};

export type CalcClosePosParamsType = {
  sizeDelta: string;
  position: Position;
  collateralCoin?: Coin;
  receiveCoin?: Coin;
  triggerPrice: string;
  keepLeverage: boolean;
};

export const DEFAULT_CLOSE_POS_SIZE_AND_FEES: ClosePosSizeAndFeesResultType = {
  closeFee: 0,
  feeDiscountUsd: 0,
  priceImpact: 0,
  rawPriceImpact: 0,
  proratedCollateralUsd: '0',
  size: '',
  collateralAmount: '',
  fundingFee: 0,
  receiveCoinAmount: '',
  finalDeltaCollateralAmount: '',
  closePx: '',
  collateralTokenPx: '',
  isPending: false,
};

export const getClosePosSizeAndFeesStoreKey = ({
  collateralCoinType,
  receiveCoinType,
}: {
  collateralCoinType?: string;
  receiveCoinType?: string;
}) => `${collateralCoinType || ''}:${receiveCoinType || ''}`;

interface PositionsStore {
  processingItemIds: Set<string>;
  addProcessingItemId: (id: string) => void;
  removeProcessingItemId: (id: string) => void;
  isClosingAll: boolean;
  setClosingAll: (isClosingAll: boolean) => void;
  closePosSizeAndFeesParams: CalcClosePosParamsType | null;
  closePosSizeAndFeesResults: Record<
    string,
    ClosePosSizeAndFeesResultType | undefined
  >;
  setClosePosSizeAndFeesParams: (params: CalcClosePosParamsType) => void;
  setClosePosSizeAndFeesResult: (
    key: string,
    result: ClosePosSizeAndFeesResultType | undefined,
  ) => void;
  setClosePosSizeAndFeesPending: (key: string, isPending: boolean) => void;
}

export const usePositionsStore = create<PositionsStore>((set) => ({
  processingItemIds: new Set(),
  addProcessingItemId: (id) =>
    set((state) => ({
      processingItemIds: new Set(state.processingItemIds).add(id),
    })),
  removeProcessingItemId: (id) =>
    set((state) => {
      const newSet = new Set(state.processingItemIds);
      newSet.delete(id);
      return { processingItemIds: newSet };
  }),
  isClosingAll: false,
  setClosingAll: (isClosingAll) => set({ isClosingAll }),
  closePosSizeAndFeesParams: null,
  closePosSizeAndFeesResults: {},
  setClosePosSizeAndFeesParams: (closePosSizeAndFeesParams) =>
    set({ closePosSizeAndFeesParams }),
  setClosePosSizeAndFeesResult: (key, result) =>
    set((state) => ({
      closePosSizeAndFeesResults: {
        ...state.closePosSizeAndFeesResults,
        [key]: result,
      },
    })),
  setClosePosSizeAndFeesPending: (key, isPending) =>
    set((state) => ({
      closePosSizeAndFeesResults: {
        ...state.closePosSizeAndFeesResults,
        [key]: {
          ...(state.closePosSizeAndFeesResults[key] ||
            DEFAULT_CLOSE_POS_SIZE_AND_FEES),
          isPending,
        },
      },
    })),
}));

export const getCalcClosePositionSizeParams = () =>
  usePositionsStore.getState().closePosSizeAndFeesParams;

export const getClosePositionSizeAndFees = ({
  collateralCoinType,
  receiveCoinType,
}: {
  collateralCoinType?: string;
  receiveCoinType?: string;
}) =>
  usePositionsStore.getState().closePosSizeAndFeesResults[
    getClosePosSizeAndFeesStoreKey({
      collateralCoinType,
      receiveCoinType,
    })
  ];
