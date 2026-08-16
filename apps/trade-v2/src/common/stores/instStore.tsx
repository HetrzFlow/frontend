'use client';

import { createContext, ReactNode, useContext } from 'react';
import {
  create,
  StateCreator,
  StoreApi,
  UseBoundStore,
  useStore,
} from 'zustand';
import { persist } from 'zustand/middleware';

import { IMAGES_MAP } from '../assets';
import { useHzSdk } from '../chainClient/hooks';
import { CREDIT_TOKEN_SYMBOL } from '../constants';
import {
  coinDataStaleTime,
  getCoins,
  getInsts,
  Inst,
  Coin,
  getInstDataState,
  instDataStaleTime,
  getCoinDataState,
} from '../services/rest/inst';
import { indexCoins } from './coinIndex';

type DataStruct<T> = {
  requestPending: boolean;
  initialized: boolean;
  raw: T[];
  map: Record<string, T>;
  view: T[];
};

interface InstState {
  insts: DataStruct<Inst>;
  coins: DataStruct<Coin>;
  getInst: (state: InstAction & InstState, instId: string) => Inst | undefined;
  getInsts: (forceFetch?: boolean) => Record<string, Inst>;
  getInstsArr: () => Inst[];
  getViewInstsArr: () => Inst[];
  getCoins: () => Record<string, Coin>;
  getCoinsArr: () => Coin[];
  getUsdcCoin: (state: InstAction & InstState) => Coin | undefined;
  getUsdtCoin: (state: InstAction & InstState) => Coin | undefined;
}

interface InstAction {
  setInsts: (instsData: DataStruct<Inst>) => void;
  setCoins: (coinsData: DataStruct<Coin>) => void;
}

const indexInsts = (insts: Inst[]): Record<string, Inst> => {
  const index: Record<string, Inst> = {};

  for (const inst of insts) {
    index[inst.id] = inst;
    if (inst.marketTokenAddress) {
      index[inst.marketTokenAddress] = inst;
    }
  }

  return index;
};

const getViewInsts = (insts: Inst[]) =>
  insts.filter((inst) => inst.isView ?? inst.is_view ?? true);

// instState
const instState: (
  hzSdk: ReturnType<typeof useHzSdk>,
) => StateCreator<InstAction & InstState, [], [], InstState> =
  (hzSdk) => (set, get) => {
    return {
      getInst(state, instId) {
        const insts = state.getInsts();
        return insts[instId];
      },
      insts: {
        requestPending: false,
        initialized: false,
        raw: [],
        map: {},
        view: [],
      },
      getInsts() {
        const { insts, setInsts } = get();
        const {
          raw: _insts,
          map: _instsMap,
          requestPending: _requestPending,
          initialized,
        } = insts;
        const instDataState = getInstDataState(hzSdk);
        if (
          !_requestPending &&
          hzSdk?.chainId &&
          (!initialized ||
            !instDataState ||
            instDataState?.isInvalidated ||
            (instDataState.dataUpdatedAt &&
              Date.now() - instDataState.dataUpdatedAt > instDataStaleTime))
        ) {
          insts.requestPending = true;
          // get insts
          getInsts(hzSdk)
            .then((data) => {
              if (_insts !== data) {
                data.forEach((v) => {
                  v.icon =
                    (IMAGES_MAP.instIcons as Record<string, string>)[
                      v.symbol
                    ] || '';
                });

                setInsts({
                  initialized: true,
                  requestPending: false,
                  raw: data,
                  map: indexInsts(data),
                  view: getViewInsts(data),
                });
              }
            })
            .finally(() => {
              get().insts.requestPending = false;
            });

          return _instsMap;
        }

        return _instsMap;
      },
      getInstsArr() {
        const { getInsts, insts } = get();
        getInsts();
        return insts.raw;
      },
      getViewInstsArr() {
        const { getInsts, insts } = get();
        getInsts();
        return insts.view;
      },

      coins: {
        requestPending: false,
        initialized: false,
        raw: [],
        map: {},
        view: [],
      },
      getCoins() {
        const { coins, setCoins } = get();
        const {
          raw: _coins,
          map: _coinsMap,
          requestPending: _requestPending,
          initialized,
        } = coins;
        const coinDataState = getCoinDataState(hzSdk);
        if (
          !_requestPending &&
          hzSdk?.chainId &&
          (!initialized ||
            !coinDataState ||
            coinDataState.isInvalidated ||
            (coinDataState.dataUpdatedAt &&
              Date.now() - coinDataState.dataUpdatedAt > coinDataStaleTime))
        ) {
          coins.requestPending = true;
          // get coins
          getCoins(hzSdk)
            .then((data) => {
              if (_coins !== data) {
                data.forEach((v) => {
                  const isCreditToken = v.symbol === CREDIT_TOKEN_SYMBOL;
                  v.icon = isCreditToken
                    ? CREDIT_TOKEN_SYMBOL
                    : (IMAGES_MAP.coinIcons as Record<string, string>)[
                        v.symbol
                      ] || '';
                });

                setCoins({
                  initialized: true,
                  requestPending: false,
                  raw: data,
                  map: indexCoins(data),
                  view: data,
                });
              }
            })
            .finally(() => {
              get().coins.requestPending = false;
            });

          return _coinsMap;
        }
        return _coinsMap;
      },
      getCoinsArr() {
        const { getCoins, coins } = get();
        getCoins();
        return coins.raw;
      },

      getUsdcCoin(state) {
        const { getCoins } = state;
        return Object.values(getCoins()).find((v) => v.symbol === 'USDC');
      },
      getUsdtCoin(state) {
        const { getCoins } = state;
        return Object.values(getCoins()).find((v) => v.symbol === 'USDT');
      },
    };
  };

type PersistedStateType = {
  insts?: Inst[];
  coins?: Coin[];
  _coins?: Coin[];
};

// instAction
const instAction: StateCreator<InstAction & InstState, [], [], InstAction> = (
  set,
) => ({
  setInsts: (insts) =>
    set({
      insts,
    }),
  setCoins: (coins) => set({ coins }),
});

const memoInstStoresMap = new Map();

export const createInstStore = (hzSdk: ReturnType<typeof useHzSdk>) => {
  if (memoInstStoresMap.get(hzSdk)) {
    return memoInstStoresMap.get(hzSdk);
  }

  const store = create<
    InstAction & InstState,
    [['zustand/persist', PersistedStateType]]
  >(
    persist(
      (...args) => {
        return {
          ...instState(hzSdk)(...args),
          ...instAction(...args),
        };
      },
      {
        name: `v2-common.instStore.${hzSdk?.chainId ?? 'pending'}`,
        partialize: ({ insts, coins }) => ({
          insts: insts.raw,
          coins: coins.raw,
        }),

        merge: (persistedState, currentState) => {
          const { insts = [], coins = [] } =
            persistedState as PersistedStateType;

          return {
            ...currentState,
            insts: {
              ...currentState.insts,
              raw: insts,
              map: indexInsts(insts),
              view: getViewInsts(insts),
            },
            coins: {
              ...currentState.coins,
              raw: coins,
              map: indexCoins(coins),
              view: coins,
            },
          };
        },
      },
    ),
  );

  memoInstStoresMap.set(hzSdk, store);

  return store;
};

const Context = createContext(
  {} as UseBoundStore<StoreApi<InstState & InstAction>>,
);

export const InstStoreProvider = ({ children }: { children: ReactNode }) => {
  const hzSdk = useHzSdk();

  return (
    <Context.Provider value={createInstStore(hzSdk)}>
      {children}
    </Context.Provider>
  );
};

export function useInstStore<T>(
  selector: (state: InstState & InstAction) => T,
) {
  const instStore = useContext(Context);

  return useStore(instStore, selector);
}
