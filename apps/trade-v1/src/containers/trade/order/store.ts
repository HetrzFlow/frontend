import {
  ColumnFiltersState,
  SortingState,
  Updater,
} from '@tanstack/react-table';
import { create } from 'zustand';
import { ORDER_TAB_VALUE } from '@/constants/enum';

interface OrdersStore {
  onlyShowCurrentInst: boolean;
  positionSortingState: SortingState;
  orderSortingState: SortingState;
  historySortingState: SortingState;
  positionFilterState: ColumnFiltersState;
  orderFilterState: ColumnFiltersState;
  historyFilterState: ColumnFiltersState;
  setOnlyShowCurrentInst: (show: boolean) => void;
  setSortingState: (
    tabValue: ORDER_TAB_VALUE,
    updater: Updater<SortingState>,
  ) => void;
  setFilterState: (
    tabValue: ORDER_TAB_VALUE,
    updater: Updater<ColumnFiltersState>,
  ) => void;
}

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  onlyShowCurrentInst: false,
  positionSortingState: [],
  orderSortingState: [
    {
      id: 'timestamp',
      desc: true,
    },
  ],
  historySortingState: [
    {
      id: 'timestamp',
      desc: true,
    },
  ],
  positionFilterState: [],
  orderFilterState: [
    // {
    //   id: 'orderType',
    //   value: 'all',
    // },
    {
      id: 'side',
      value: 'all',
    },
  ],
  historyFilterState: [
    {
      id: 'type',
      value: 'all',
    },
    {
      id: 'action',
      value: 'all',
    },
  ],
  setOnlyShowCurrentInst: (onlyShowCurrentInst) =>
    set({
      onlyShowCurrentInst,
    }),
  setSortingState: (tabValue, updater) => {
    switch (tabValue) {
      case ORDER_TAB_VALUE.POSITION:
        set({
          positionSortingState:
            updater instanceof Function
              ? updater(get().positionSortingState)
              : updater,
        });
        break;
      case ORDER_TAB_VALUE.ORDER:
        set({
          orderSortingState:
            updater instanceof Function
              ? updater(get().orderSortingState)
              : updater,
        });
        break;
      case ORDER_TAB_VALUE.HISTORY:
        set({
          historySortingState:
            updater instanceof Function
              ? updater(get().historySortingState)
              : updater,
        });
        break;
      default:
        break;
    }
  },
  setFilterState: (tabValue, updater) => {
    switch (tabValue) {
      case ORDER_TAB_VALUE.POSITION:
        set({
          positionFilterState:
            updater instanceof Function
              ? updater(get().positionFilterState)
              : updater,
        });
        break;
      case ORDER_TAB_VALUE.ORDER:
        set({
          orderFilterState:
            updater instanceof Function
              ? updater(get().orderFilterState)
              : updater,
        });
        break;
      case ORDER_TAB_VALUE.HISTORY:
        set({
          historyFilterState:
            updater instanceof Function
              ? updater(get().historyFilterState)
              : updater,
        });
        break;
      default:
        break;
    }
  },
}));
