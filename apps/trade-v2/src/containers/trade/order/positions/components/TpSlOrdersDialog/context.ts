import { createContext, useContext } from 'react';
import { create } from 'zustand';

import type { Position } from '@/common';

// Position context for cell components
const Ctx = createContext<Position | null>(null);

export const TpSlTableProvider = Ctx.Provider;

export function useTpSlTablePosition() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error('useTpSlTablePosition must be used within TpSlTableProvider');
  return ctx;
}

// Processing state for cancel actions
interface TpSlProcessingState {
  processingItemId: string | null;
  setProcessingItemId: (id: string | null) => void;
  isProcessingAll: boolean;
  setProcessingAll: (v: boolean) => void;
}

export const useTpSlProcessingStore = create<TpSlProcessingState>((set) => ({
  processingItemId: null,
  setProcessingItemId: (id) => set({ processingItemId: id }),
  isProcessingAll: false,
  setProcessingAll: (isProcessingAll) => set({ isProcessingAll }),
}));
