import { create } from 'zustand';

type State = {
  activeTab: 'pending' | 'history';
  claimableFundingFeeUsd: string;
  claimablePriceImpactUsd: string;
  processingId: string | null;
};

type Action = {
  setState: (state: Partial<State>) => void;
  setProcessingId: (id: string | null) => void;
};

export const useClaimStore = create<State & Action>((set) => {
  return {
    activeTab: 'pending',
    claimableFundingFeeUsd: '0',
    claimablePriceImpactUsd: '0',
    processingId: null,
    setState: (state) => set(state),
    setProcessingId: (id) => set({ processingId: id }),
  };
});
