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
  poolsOpen: boolean;
  vaultsOpen: boolean;
  claimableOpen: boolean;
  pendingPoolOrdersOpen: boolean;
  pendingVaultOrdersOpen: boolean;
  assetList: AssetListItemType[];
  setPositionOpen: (open: boolean) => void;
  setOrderOpen: (open: boolean) => void;
  setPoolsOpen: (open: boolean) => void;
  setVaultsOpen: (open: boolean) => void;
  setClaimableOpen: (open: boolean) => void;
  setPendingPoolOrdersOpen: (open: boolean) => void;
  setPendingVaultOrdersOpen: (open: boolean) => void;
  setAssetList: (assetList: AssetListItemType[]) => void;
}

type PersistedStateType = {
  positionOpen: boolean;
  orderOpen: boolean;
  poolsOpen: boolean;
  vaultsOpen: boolean;
  claimableOpen: boolean;
  pendingPoolOrdersOpen: boolean;
  pendingVaultOrdersOpen: boolean;
};

export const useStore = create<
  HeaderStore,
  [['zustand/persist', PersistedStateType]]
>(
  persist(
    (set) => ({
      positionOpen: true,
      orderOpen: true,
      poolsOpen: true,
      vaultsOpen: true,
      claimableOpen: true,
      pendingPoolOrdersOpen: true,
      pendingVaultOrdersOpen: true,
      assetList: [],
      setPositionOpen: (open) => set({ positionOpen: open }),
      setOrderOpen: (open) => set({ orderOpen: open }),
      setPoolsOpen: (open) => set({ poolsOpen: open }),
      setVaultsOpen: (open) => set({ vaultsOpen: open }),
      setClaimableOpen: (open) => set({ claimableOpen: open }),
      setPendingPoolOrdersOpen: (open) =>
        set({ pendingPoolOrdersOpen: open }),
      setPendingVaultOrdersOpen: (open) =>
        set({ pendingVaultOrdersOpen: open }),
      setAssetList: (assetList) => set({ assetList }),
    }),
    {
      name: 'v2-header.store', // localStorage key
      partialize: ({
        positionOpen,
        orderOpen,
        poolsOpen,
        vaultsOpen,
        claimableOpen,
        pendingPoolOrdersOpen,
        pendingVaultOrdersOpen,
      }) => ({
        positionOpen,
        orderOpen,
        poolsOpen,
        vaultsOpen,
        claimableOpen,
        pendingPoolOrdersOpen,
        pendingVaultOrdersOpen,
      }),
    },
  ),
);
