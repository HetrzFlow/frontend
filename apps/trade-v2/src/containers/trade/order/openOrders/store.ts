import { OnChangeFn, RowSelectionState } from '@tanstack/react-table';
import { create } from 'zustand';

interface OpenOrdersStore {
  rowSelection: RowSelectionState;
  setRowSelection: OnChangeFn<RowSelectionState>;
  processingItemId: string | null;
  setProcessingItemId: (id: string | null) => void;
  isProcessingAll: boolean;
  setProcessingAll: (isProcessingAll: boolean) => void;
}

export const useOpenOrdersStore = create<OpenOrdersStore>((set, get) => ({
  rowSelection: {},
  setRowSelection: (updater) =>
    set({
      rowSelection:
        updater instanceof Function ? updater(get().rowSelection) : updater,
    }),
  processingItemId: null,
  setProcessingItemId: (id) => set({ processingItemId: id }),
  isProcessingAll: false,
  setProcessingAll: (isProcessingAll) => set({ isProcessingAll }),
}));
