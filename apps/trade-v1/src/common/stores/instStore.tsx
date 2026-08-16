'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import { normalizeStructTag } from '@mysten/sui/utils';
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
import { getCoins, getInsts, Inst, Coin } from '../services/rest/inst';

interface InstState {
  _requestMark: { insts: boolean; coins: boolean };
  _insts: Inst[];
  _instsMap: Record<string, Inst>;
  _coins: Coin[];
  _coinsMap: Record<string, Coin>;
  getInst: (state: InstAction & InstState, instId: string) => Inst | undefined;
  getInsts: () => Record<string, Inst>;
  getInstsArr: () => Inst[];
  getCoins: () => Record<string, Coin>;
  getCoinsArr: () => Coin[];
  getBaseCoin: (
    state: InstAction & InstState,
    instId: string,
  ) => Coin | undefined;
  getUsdcCoin: (state: InstAction & InstState) => Coin | undefined;
}

interface InstAction {
  setInsts: (insts: Inst[]) => void;
  setInstsMap: (instsMap: Record<string, Inst>) => void;
  setCoins: (coins: Coin[]) => void;
  setCoinsMap: (coinsMap: Record<string, Coin>) => void;
}
//: StateCreator<InstAction & InstState, [], [], InstState>
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
      _requestMark: {
        insts: false,
        coins: false,
      },
      _insts: [],
      _instsMap: {},
      getInsts() {
        const { _insts, _instsMap, _requestMark, setInsts, setInstsMap } =
          get();
        if (!_requestMark.insts) {
          _requestMark.insts = true;
          // get insts
          getInsts(hzSdk)
            .then((data) => {
              if (_insts !== data) {
                data.forEach((v) => {
                  v.icon =
                    (IMAGES_MAP.instIcons as Record<string, string>)[v.id] ||
                    '';
                  v.coinType = normalizeStructTag(v.coin_type);
                  v.baseCoin = v.coinType;
                });

                setInsts(data);
                setInstsMap(
                  data.reduce((acc, cur) => {
                    return { ...acc, [cur.id]: cur, [cur.coinType]: cur };
                  }, {}) as Record<string, Inst>,
                );
              }
            })
            .catch(() => {
              _requestMark.insts = false;
            });

          return _insts.reduce((acc, cur) => {
            return Object.assign(acc, { [cur.id]: cur, [cur.coinType]: cur });
          }, _instsMap) as Record<string, Inst>;
        }
        return _instsMap;
      },
      getInstsArr() {
        const { getInsts, _insts } = get();
        getInsts();
        return _insts;
      },

      _coins: [],
      _coinsMap: {},
      getCoins() {
        const { _coins, _coinsMap, _requestMark, setCoins, setCoinsMap } =
          get();
        if (!_requestMark.coins) {
          _requestMark.coins = true;
          // get coins
          getCoins(hzSdk)
            .then((data) => {
              if (_coins !== data) {
                data.forEach((v) => {
                  v.icon =
                    (IMAGES_MAP.coinIcons as Record<string, string>)[
                      v.symbol
                    ] || '';
                  v.coinType = normalizeStructTag(v.coinType);
                });

                setCoins(data);
                setCoinsMap(
                  data.reduce((acc, cur) => {
                    return {
                      ...acc,
                      [cur.coinType]: cur,
                      [normalizeStructTag(cur.coinType)]: cur,
                      [cur.symbol]: cur,
                    };
                  }, {}) as Record<string, Coin>,
                );
              }
            })
            .catch(() => {
              _requestMark.coins = false;
            });

          return _coins.reduce((acc, cur) => {
            return Object.assign(acc, {
              [cur.coinType]: cur,
              [normalizeStructTag(cur.coinType)]: cur,
              [cur.symbol]: cur,
            });
          }, _coinsMap) as Record<string, Coin>;
        }
        return _coinsMap;
      },
      getCoinsArr() {
        const { getCoins, _coins } = get();
        getCoins();
        return _coins;
      },

      getBaseCoin(state, instId) {
        const { getInst, getCoins } = state;
        const baseCoinType = getInst(state, instId)?.coinType;
        return getCoins()[baseCoinType || ''];
      },
      getUsdcCoin(state) {
        const { getCoins } = state;
        return Object.values(getCoins()).find((v) => v.symbol === 'USDC');
      },
    };
  };

type PersistedStateType = {
  _insts: Inst[];
  _coins: Coin[];
};

// instAction
const instAction: StateCreator<InstAction & InstState, [], [], InstAction> = (
  set,
) => ({
  setInsts: (insts) => set({ _insts: insts }),
  setInstsMap: (instsMap) => set({ _instsMap: instsMap }),
  setCoins: (coins) => set({ _coins: coins }),
  setCoinsMap: (coinsMap) => set({ _coinsMap: coinsMap }),
});

export const createInstStore = (hzSdk: ReturnType<typeof useHzSdk>) =>
  create<InstAction & InstState, [['zustand/persist', PersistedStateType]]>(
    persist(
      (...args) => {
        return {
          ...instState(hzSdk)(...args),
          ...instAction(...args),
        };
      },
      {
        name: `v1-common.instStore.${hzSdk.fullClient.network}`,
        partialize: ({ _insts, _coins }) => ({
          _insts,
          _coins,
        }),
      },
    ),
  );

const Context = createContext(
  {} as UseBoundStore<StoreApi<InstState & InstAction>>,
);

export const InstStoreProvider = ({ children }: { children: ReactNode }) => {
  const hzSdk = useHzSdk();

  const instStore = useMemo(() => {
    return createInstStore(hzSdk);
  }, [hzSdk]);
  return <Context.Provider value={instStore}>{children}</Context.Provider>;
};

export function useInstStore<T>(
  selector: (state: InstState & InstAction) => T,
) {
  const instStore = useContext(Context);

  return useStore(instStore, selector);
}
