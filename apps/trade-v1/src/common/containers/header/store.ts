import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BN } from '@repo/lib/calc';
import { Coin } from '../../services/rest/inst';

type AssetListItemType = {
  coin: Coin;
  size: string;
  usdValue: string | BN;
};

interface HeaderStore {
  positionOpen: boolean;
  orderOpen: boolean;
  assetList: AssetListItemType[];
  setPositionOpen: (open: boolean) => void;
  setOrderOpen: (open: boolean) => void;
  setAssetList: (assetList: AssetListItemType[]) => void;
}

type PersistedStateType = {
  positionOpen: boolean;
  orderOpen: boolean;
};

export const useStore = create<
  HeaderStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set) => ({
      positionOpen: true,
      orderOpen: true,
      assetList: [],
      setPositionOpen: (open) => set({ positionOpen: open }),
      setOrderOpen: (open) => set({ orderOpen: open }),
      setAssetList: (assetList) => set({ assetList }),
    }),
    {
      name: 'v1-header.store', // localStorage key
      partialize: ({ positionOpen, orderOpen }) => ({
        positionOpen,
        orderOpen,
      }),
    },
  ),
);
