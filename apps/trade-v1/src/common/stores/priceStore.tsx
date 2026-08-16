import { create } from 'zustand';

export type PriceTickerStoreItem = {
  t: number;
  s: string;
  p: string;
  n: string;
  d: string;
  i: string;
  prevLast?: string;
  isLiveUp?: boolean;
  isLiveDown?: boolean;
};

type State = {
  priceTickers: Record<string, PriceTickerStoreItem[] | undefined>;
};

type Action = {
  setPriceTicker: (
    symbol: string,
    ticker: PriceTickerStoreItem[] | undefined,
  ) => void;
};

export const usePriceStore = create<State & Action>((set) => {
  return {
    priceTickers: {},
    setPriceTicker: (symbol, ticker) =>
      set((state) => {
        if (state.priceTickers[symbol] === ticker) return state;
        return {
          priceTickers: {
            ...state.priceTickers,
            [symbol]: ticker,
          },
        };
      }),
  };
});
