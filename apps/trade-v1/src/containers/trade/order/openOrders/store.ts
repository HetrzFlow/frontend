import { OnChangeFn, RowSelectionState } from '@tanstack/react-table';
import { create } from 'zustand';

interface OpenOrdersStore {
  rowSelection: RowSelectionState;
  setRowSelection: OnChangeFn<RowSelectionState>;
}

export const useOpenOrdersStore = create<OpenOrdersStore>((set, get) => ({
  rowSelection: {},
  setRowSelection: (updater) =>
    set({
      rowSelection:
        updater instanceof Function ? updater(get().rowSelection) : updater,
    }),
}));
